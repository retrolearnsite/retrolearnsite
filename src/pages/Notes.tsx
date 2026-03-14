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
    if (!loading && !user) navigate('/');
  }, [user, loading, navigate]);

  const handleViewNote = (note: any) => setCurrentNote(note);
  const handleReset = () => setCurrentNote(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto py-24 text-center text-muted-foreground">Loading your notes...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background" style={{ padding: '28px 32px' }}>
      <div className="max-w-6xl mx-auto space-y-7">
        <header className="text-center relative crt-scanlines crt-glow rounded-lg" style={{ padding: '40px 0 32px' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="absolute left-0 top-2 md:top-8 font-mono text-xs uppercase tracking-[0.06em]">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Back Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-primary/30" style={{ background: 'linear-gradient(135deg, rgba(232,98,42,0.15), rgba(240,192,64,0.15))' }}>
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-5xl font-display text-glow-orange mb-2">
                  My <span className="text-primary">Notes</span>
                </h1>
                <div className="flex items-center justify-center gap-2 text-sm text-crt-yellow font-mono">
                  <FileText className="w-4 h-4" />
                  <span>Browse & Study</span>
                </div>
              </div>
            </div>
            
            <p className="text-[15px] text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
              Access all your <span className="text-primary font-medium">transformed notes</span>, flashcards, and study materials
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {currentNote ? (
            <StudyResults isVisible={true} onReset={handleReset} noteData={currentNote} />
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

        <footer className="text-center pt-7 border-t border-border/30">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-[0.06em]">Your Personal Study Library</span>
            <Sparkles className="w-4 h-4 text-crt-yellow" />
          </div>
        </footer>
        
        <ContinueGuideButton />
      </div>
    </div>
  );
};

export default Notes;
