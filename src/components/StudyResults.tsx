import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Zap, HelpCircle, Download, RefreshCw } from "lucide-react";

interface StudyResultsProps {
  isVisible: boolean;
  onReset: () => void;
  noteData?: any;
}

const mockSummary = `# PROJECT ALPHA - EXECUTIVE SUMMARY

## KEY OBJECTIVES
• Improve user engagement metrics through gamification
• Implement feature improvements within $50k budget
• Complete development in 3-month timeline

## CRITICAL INSIGHTS  
• Competitors show 30% better retention rates
• User demand for dark mode and performance improvements
• Technical feasibility concerns from development team

## ACTION ITEMS
• Conduct legal review for data privacy compliance
• Schedule stakeholder meeting (Friday 2PM)
• Finalize marketing strategy for social features`;

const mockFlashcards = [
  {
    front: "What is the budget constraint for Project Alpha?",
    back: "$50,000 maximum budget allocated for the project"
  },
  {
    front: "What is the project timeline?",
    back: "3 months from project initiation to completion"
  },
  {
    front: "What percentage better retention do competitors have?",
    back: "30% better retention rates compared to current metrics"
  },
  {
    front: "What are the top user feedback requests?",
    back: "Dark mode implementation and faster loading speeds"
  },
  {
    front: "When is the next team meeting scheduled?",
    back: "Friday at 2:00 PM"
  }
];

const mockQA = [
  {
    question: "What are the main challenges facing Project Alpha?",
    answer: "Technical feasibility concerns from the team, budget constraints of $50k, and competing against products with 30% better retention rates."
  },
  {
    question: "What features do users want most?",
    answer: "Dark mode, faster loading times, and social features according to user feedback and marketing requests."
  },
  {
    question: "What needs to happen before launch?",
    answer: "Legal review for data privacy, completion of gamification elements, and stakeholder approval at Friday's meeting."
  },
  {
    question: "How does the competition compare?",
    answer: "Competitor analysis shows they have 30% better user retention rates, indicating areas for improvement in our engagement strategy."
  }
];

// Helper function to parse markdown bold syntax (**text**) and render as bold
const parseMarkdownBold = (text: string | undefined | null) => {
  if (!text) return '';
  
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="text-primary font-bold">
          {boldText}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export const StudyResults = ({ isVisible, onReset, noteData }: StudyResultsProps) => {
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const navigate = useNavigate();

  // Use real data or fallback to mock data
  const summary = noteData?.summary || mockSummary;
  const flashcards = noteData?.generated_flashcards || mockFlashcards;
  const qaData = noteData?.generated_qa || mockQA;
  const keyPoints = noteData?.key_points || [];

  const handleExport = () => {
    const title = noteData?.title || "Study Materials";
    const date = new Date().toLocaleDateString();
    
    let textContent = `${title}\n`;
    textContent += `Generated on: ${date}\n`;
    textContent += "=" + "=".repeat(title.length + 20) + "\n\n";

    // Add Key Points if available
    if (keyPoints.length > 0) {
      textContent += "KEY POINTS\n";
      textContent += "----------\n";
      keyPoints.forEach((point, index) => {
        textContent += `${index + 1}. ${point}\n`;
      });
      textContent += "\n";
    }

    // Add Summary
    textContent += "SUMMARY\n";
    textContent += "-------\n";
    textContent += summary + "\n\n";

    // Add Flashcards
    textContent += "FLASHCARDS\n";
    textContent += "----------\n";
    flashcards.forEach((card, index) => {
      textContent += `Card ${index + 1}:\n`;
      textContent += `Q: ${card.front}\n`;
      textContent += `A: ${card.back}\n\n`;
    });

    // Add Q&A
    textContent += "QUESTIONS & ANSWERS\n";
    textContent += "------------------\n";
    qaData.forEach((item, index) => {
      textContent += `${index + 1}. ${item.question}\n`;
      textContent += `   ${item.answer}\n\n`;
    });

    const dataBlob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_study_materials.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentFlashcard((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentFlashcard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <Card className="p-6 bg-card border-2 border-success scanlines shadow-neon">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-retro glow-text animate-fade-in flex items-center gap-3">
              <Zap className="w-6 h-6 text-accent animate-pulse" />
              Study Materials Ready
            </h2>
            <p className="text-sm text-muted-foreground font-retro mt-1">
              Your notes have been transformed into organized learning resources
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport} className="hover-scale">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/note-wizard')} className="hover-scale">
              <RefreshCw className="w-4 h-4" />
              New Notes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted border border-primary">
            <TabsTrigger value="summary" className="font-retro">
              <FileText className="w-4 h-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="font-retro">
              <Zap className="w-4 h-4 mr-2" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="qa" className="font-retro">
              <HelpCircle className="w-4 h-4 mr-2" />
              Q&A
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <Card className="p-8 bg-muted border-2 border-secondary">
              {keyPoints.length > 0 && (
                <div className="mb-8 space-y-4">
                  <h3 className="font-retro font-bold text-primary text-lg mb-4">KEY POINTS</h3>
                  <ul className="space-y-4">
                    {keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-3 group">
                        <span className="text-accent font-bold text-lg mt-0.5 flex-shrink-0">•</span>
                        <span className="font-retro text-base leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors">
                          {parseMarkdownBold(point)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <hr className="border-secondary/50 my-6" />
                </div>
              )}
              <ScrollArea className="h-[400px] pr-4">
                <div className="font-retro text-base leading-relaxed text-foreground/90 whitespace-pre-wrap space-y-4">
                  {parseMarkdownBold(summary)}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="flashcards" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-retro text-muted-foreground">
                      Card {currentFlashcard + 1} of {flashcards.length}
                    </span>
                    <div className="flex-1 bg-muted h-2 w-48 rounded-full overflow-hidden border border-primary/30">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                        style={{ width: `${((currentFlashcard + 1) / flashcards.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={prevCard} className="hover-scale font-retro">
                      ← PREV
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextCard} className="hover-scale font-retro">
                      NEXT →
                    </Button>
                  </div>
                </div>
                
                <div className="perspective-1000">
                  <Card 
                    className={`h-[400px] cursor-pointer bg-gradient-to-br from-muted to-muted/50 border-2 ${
                      isFlipped ? 'border-accent shadow-pink' : 'border-primary shadow-blue'
                    } hover:shadow-neon transition-all duration-500 animate-scale-in scanlines overflow-hidden relative group`}
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <div className={`px-3 py-1 rounded-md border-2 font-retro text-xs ${
                        isFlipped ? 'border-accent bg-accent/20 text-accent glow-pink' : 'border-primary bg-primary/20 text-primary glow-blue'
                      }`}>
                        {isFlipped ? "ANSWER" : "QUESTION"}
                      </div>
                    </div>
                    
                    <div className="h-full flex items-center justify-center p-8">
                      <div className="text-center max-w-2xl">
                        <p className="font-retro text-lg leading-relaxed text-foreground group-hover:text-primary transition-colors">
                          {isFlipped 
                            ? parseMarkdownBold(flashcards[currentFlashcard].back)
                            : parseMarkdownBold(flashcards[currentFlashcard].front)
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-retro bg-background/80 px-4 py-2 rounded-full border border-primary/30">
                        <Zap className="w-3 h-3" />
                        Click to {isFlipped ? "see question" : "reveal answer"}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
          </TabsContent>

          <TabsContent value="qa" className="mt-6">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {qaData.map((item: any, index: number) => (
                  <Card 
                    key={index} 
                    className="p-6 bg-gradient-to-br from-muted to-muted/50 border-2 border-secondary hover:border-primary transition-all duration-300 group hover:shadow-blue animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center font-retro text-sm glow-blue">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-retro font-bold text-primary text-base mb-3 group-hover:glow-blue transition-all">
                            {parseMarkdownBold(item.question)}
                          </div>
                          <div className="font-retro text-sm text-foreground/90 leading-relaxed pl-4 border-l-2 border-accent bg-accent/5 py-2 pr-2 rounded-r">
                            {parseMarkdownBold(item.answer)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};