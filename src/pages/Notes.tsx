import { useState, useEffect } from "react";
import { NotesList } from "@/components/NotesList";
import { StudyResults } from "@/components/StudyResults";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { ArrowLeft, FileText, Sparkles, Users } from "lucide-react";
import { ContinueGuideButton } from "@/components/ContinueGuideButton";

const Notes = () => {
  const [currentNote, setCurrentNote] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("my-notes");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleViewNote = (note: any) => {
    setCurrentNote(note);
  };

  const handleReset = () => {
    setCurrentNote(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto py-24 text-center text-muted-foreground">
          Loading your notes...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center py-8 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="absolute left-0 top-8 font-retro"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back Home
          </Button>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-retro gradient-text-retro mb-2">
                My Notes
              </h1>
              <div className="flex items-center justify-center gap-2 text-lg font-retro text-primary">
                <FileText className="w-5 h-5" />
                <span>Browse & Study</span>
              </div>
            </div>
          </div>
          
          <p className="text-lg font-retro text-muted-foreground max-w-2xl mx-auto">
            Access all your transformed notes, flashcards, and study materials in one place
          </p>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          {currentNote ? (
            <StudyResults 
              isVisible={true}
              onReset={handleReset}
              noteData={currentNote}
            />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <AnimatedTabs
                tabs={[
                  { value: "my-notes", label: "My Notes", icon: FileText },
                  { value: "shared-notes", label: "Shared Notes", icon: Users }
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                className="mb-6"
              />
              
              <TabsContent value="my-notes" className="space-y-4">
                <NotesList onViewNote={handleViewNote} notesType="regular" />
              </TabsContent>
              
              <TabsContent value="shared-notes" className="space-y-4">
                <NotesList onViewNote={handleViewNote} notesType="shared" />
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-primary">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-secondary" />
            <span className="font-retro text-sm text-muted-foreground">
              Your Personal Study Library
            </span>
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
        </footer>
        
        {/* Guide Continue Button */}
        <ContinueGuideButton />
      </div>
    </div>
  );
};

export default Notes;