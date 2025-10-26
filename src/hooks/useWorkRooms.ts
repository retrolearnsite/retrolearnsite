import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/integrations/supabase/types'

type WorkRoom = Database['public']['Tables']['work_rooms']['Row']
type RoomMember = Database['public']['Tables']['room_members']['Row']
type SharedNote = Database['public']['Tables']['room_shared_notes']['Row'] & {
  note: Database['public']['Tables']['notes']['Row']
}

export function useWorkRooms() {
  const [rooms, setRooms] = useState<WorkRoom[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  // Fetch user's rooms
  const fetchRooms = async () => {
    if (!user) {
      setRooms([])
      setLoading(false)
      return
    }

    try {
      // First get the room IDs where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', user.id)

      if (memberError) throw memberError

      if (!memberData || memberData.length === 0) {
        setRooms([])
        setLoading(false)
        return
      }

      const roomIds = memberData.map(m => m.room_id)

      // Then get the room details
      const { data, error } = await supabase
        .from('work_rooms')
        .select('*')
        .in('id', roomIds)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRooms(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch work rooms",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate unique room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  // Create a new work room
  const createRoom = async (
    name: string, 
    description?: string,
    isPublic: boolean = false,
    subjectTags: string[] = []
  ): Promise<WorkRoom | null> => {
    if (!user) return null

    try {
      const code = generateRoomCode()
      
      const { data: room, error: roomError } = await supabase
        .from('work_rooms')
        .insert({
          name,
          description,
          code,
          creator_id: user.id,
          is_public: isPublic,
          subject_tags: subjectTags,
          member_count: 1
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Add creator as member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: 'admin'
        })

      if (memberError) throw memberError

      setRooms(prev => [room, ...prev])
      
      toast({
        title: "Room created!",
        description: `Work room "${name}" created${!isPublic ? ` with code: ${code}` : ''}`,
      })

      return room
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create work room",
        variant: "destructive",
      })
      return null
    }
  }

  // Join a room with code
  const joinRoom = async (code: string): Promise<WorkRoom | null> => {
    if (!user) return null

    try {
      // Find room by code
      const { data: room, error: roomError } = await supabase
        .from('work_rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .single()

      if (roomError) throw roomError

      // Add user as member
      const { error: memberError } = await supabase
        .from('room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: 'member'
        })

      if (memberError) {
        if (memberError.code === '23505') { // Unique constraint violation
          toast({
            title: "Already a member",
            description: "You are already a member of this room",
            variant: "destructive",
          })
          return null
        }
        throw memberError
      }

      setRooms(prev => [room, ...prev])
      
      toast({
        title: "Joined room!",
        description: `Successfully joined "${room.name}"`,
      })

      return room
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message === 'No rows' ? "Room not found" : "Failed to join room",
        variant: "destructive",
      })
      return null
    }
  }

  // Leave a room
  const leaveRoom = async (roomId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id)

      if (error) throw error

      setRooms(prev => prev.filter(room => room.id !== roomId))
      
      toast({
        title: "Left room",
        description: "You have left the work room",
      })

      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to leave room",
        variant: "destructive",
      })
      return false
    }
  }

  // Delete a room (only for creators)
  const deleteRoom = async (roomId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('work_rooms')
        .delete()
        .eq('id', roomId)
        .eq('creator_id', user.id)

      if (error) throw error

      setRooms(prev => prev.filter(room => room.id !== roomId))
      
      toast({
        title: "Room deleted",
        description: "Work room has been permanently deleted",
      })

      return true
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      })
      return false
    }
  }

  // Get room members  
  const getRoomMembers = async (roomId: string): Promise<RoomMember[]> => {
    try {
      // First get room members
      const { data: members, error: memberError } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true })

      if (memberError) {
        console.error('Error fetching room members:', memberError)
        throw memberError
      }

      console.log('Fetched room members:', members)

      if (!members || members.length === 0) return []

      // Then get profiles for each member
      const memberUserIds = [...new Set(members.map(m => m.user_id))]
      const profilesData = await Promise.all(
        memberUserIds.map(async (userId) => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', userId)
            .single()
          
          if (profileError) {
            console.error('Error fetching profile for user:', userId, profileError)
          } else {
            console.log('Fetched profile for user:', userId, profile)
          }
          
          return { userId, profile }
        })
      )

      const profilesMap = Object.fromEntries(
        profilesData.map(p => [p.userId, p.profile])
      )

      // Combine members with their profiles
      const membersWithProfiles = members.map(member => ({
        ...member,
        profiles: profilesMap[member.user_id]
      }))

      console.log('Final members with profiles:', membersWithProfiles)
      return membersWithProfiles
    } catch (error) {
      console.error('Error fetching room members:', error)
      return []
    }
  }

  // Share a note to room
  const shareNoteToRoom = async (roomId: string, noteId: string): Promise<boolean> => {
    if (!user) return false

    try {
      // Check if note is already shared in this room
      const { data: existing, error: checkError } = await supabase
        .from('room_shared_notes')
        .select('id')
        .eq('room_id', roomId)
        .eq('note_id', noteId)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing shared note:', checkError)
      }

      if (existing) {
        toast({
          title: "Already shared",
          description: "This note has already been shared in this room",
          variant: "destructive",
        })
        return false
      }

      // Get room details to check if it's public or private
      const { data: room, error: roomError } = await supabase
        .from('work_rooms')
        .select('is_public')
        .eq('id', roomId)
        .single()

      if (roomError) throw roomError

      // Record the sharing in room_shared_notes for viewing in the wall
      const { error: insertError } = await supabase
        .from('room_shared_notes')
        .insert({
          room_id: roomId,
          note_id: noteId,
          shared_by_user_id: user.id
        })

      if (insertError) {
        // If insert fails with unique constraint, note was already shared
        if (insertError.code === '23505') {
          toast({
            title: "Already shared",
            description: "This note has already been shared in this room",
            variant: "destructive",
          })
          return false
        }
        throw insertError
      }

      // If private room, also copy the note to all room members' libraries
      let memberCount = 0
      if (!room.is_public) {
        // Use the secure RPC function to copy note to members' libraries
        const { data: count, error: copyError } = await supabase
          .rpc('share_note_to_room', {
            p_room_id: roomId,
            p_note_id: noteId
          })

        if (copyError) {
          console.error('Error copying note to libraries:', copyError)
          // Still show success for sharing to wall even if library copy fails
        } else {
          memberCount = count || 0
        }

        // Notify all members that a note was added to their library (only for private rooms)
        if (memberCount > 0) {
          toast({
            title: "Note shared and added to libraries!",
            description: `Note added to ${memberCount} member${memberCount > 1 ? 's' : ''} libraries`,
          })
        } else {
          toast({
            title: "Note shared!",
            description: "Note is now visible in the room's shared notes",
          })
        }
      } else {
        // Public room - just show in wall, don't copy to libraries
        toast({
          title: "Note shared!",
          description: "Note is now visible in the room's shared notes",
        })
      }

      return true
    } catch (error: any) {
      console.error('Error sharing note:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to share note",
        variant: "destructive",
      })
      return false
    }
  }

  // Get shared notes for a room
  const getRoomSharedNotes = async (roomId: string): Promise<SharedNote[]> => {
    try {
      const { data, error } = await supabase
        .from('room_shared_notes')
        .select(`
          *,
          note:notes (*),
          profiles:shared_by_user_id (
            full_name,
            email
          )
        `)
        .eq('room_id', roomId)
        .order('shared_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching shared notes:', error)
      return []
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [user])

  return {
    rooms,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    deleteRoom,
    getRoomMembers,
    shareNoteToRoom,
    getRoomSharedNotes,
    refetch: fetchRooms,
  }
}