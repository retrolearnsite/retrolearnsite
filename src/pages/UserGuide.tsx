import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, PlayCircle, Star, Brain, Users, FileText, Sparkles, BookOpen, Home, Zap, Rocket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserGuideProgress } from "@/hooks/useUserGuideProgress";
import { useToast } from "@/hooks/use-toast";
import mascotImage from "@/assets/retro-wizard-mascot.jpg";
import { setGuideStep, clearGuideStep, markGuideCompleted } from "@/components/ContinueGuideButton";
interface GuideStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<any>;
  route?: string;
  action?: string;
  emoji: string;
}
const guideSteps: GuideStep[] = [{
  id: "welcome",
  title: "Welcome!",
  subtitle: "Let's get you started",
  description: "Study Platform transforms your messy notes into organized study materials with AI magic. This quick tour will show you how!",
  icon: Sparkles,
  emoji: "✨"
}, {
  id: "note-wizard",
  title: "Transform Your Notes",
  subtitle: "The core feature",
  description: "Got messy notes? Upload text or images and watch AI turn them into summaries, flashcards, and Q&A sets. It's like having a study buddy who never sleeps!",
  icon: Brain,
  route: "/note-wizard",
  action: "Try Note Wizard",
  emoji: "🧠"
}, {
  id: "notes",
  title: "Your Notes Library",
  subtitle: "Everything in one place",
  description: "All your processed notes live here. Search, filter, review, and export them anytime. Your personal knowledge base!",
  icon: FileText,
  route: "/notes",
  action: "View Notes",
  emoji: "📝"
}, {
  id: "learn",
  title: "Deep Dive Learning",
  subtitle: "Explore any topic",
  description: "Want to explore something new? Get Wikipedia articles, YouTube videos, and Reddit discussions all in one place. Research made easy!",
  icon: BookOpen,
  route: "/learn",
  action: "Explore Topics",
  emoji: "📚"
}, {
  id: "quizzes",
  title: "Test Yourself",
  subtitle: "Know what you know",
  description: "Generate instant quizzes on any topic. Each question comes with explanations so you actually learn from your mistakes!",
  icon: Zap,
  route: "/quizzes",
  action: "Take a Quiz",
  emoji: "⚡"
}, {
  id: "work-rooms",
  title: "Study Together",
  subtitle: "Collaboration rocks",
  description: "Create study rooms to share notes with classmates. Learning is better together!",
  icon: Users,
  route: "/workrooms",
  action: "Join a Room",
  emoji: "👥"
}, {
  id: "ready",
  title: "You're All Set!",
  subtitle: "Time to shine",
  description: "That's it! You now know how to use every major feature. Ready to transform how you learn?",
  icon: Star,
  emoji: "🌟"
}];
const UserGuide = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    currentStep,
    completedSteps,
    isLoading,
    goToStep,
    nextStep,
    prevStep,
    markStepComplete,
    forceSave
  } = useUserGuideProgress();
  const currentGuideStep = guideSteps[currentStep];
  const progress = currentStep / (guideSteps.length - 1) * 100;
  const goToFeature = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to try this feature",
        variant: "destructive"
      });
      return;
    }
    if (currentGuideStep.route) {
      await forceSave(); // Save before navigating
      setGuideStep(currentStep); // Store current step for return
      navigate(currentGuideStep.route);
    }
  };
  const handleBackHome = async () => {
    await forceSave(); // Save before going home
    clearGuideStep(); // Clear guide tracking
    navigate('/');
  };
  const jumpToStep = (stepIndex: number) => {
    goToStep(stepIndex);
  };
  const handleFinishGuide = async () => {
    await forceSave(); // Save final progress
    clearGuideStep(); // Clear guide tracking
    markGuideCompleted(); // Persist completion for guests and UI gating
    // Mark the final step as complete if not already
    if (!completedSteps.has(currentStep)) {
      markStepComplete();
      // Small delay to ensure the completion is saved
      setTimeout(async () => {
        await forceSave();
        toast({
          title: "🎉 Congratulations!",
          description: "You've completed the Study Platform guide! You're now ready to master all features.",
          duration: 5000
        });
        navigate('/');
      }, 1000);
    } else {
      toast({
        title: "🎉 Welcome Back!",
        description: "You've already mastered Study Platform. Time to put your skills to use!",
        duration: 3000
      });
      navigate('/');
    }
  };
  const handleNextStep = () => {
    // Mark current as complete and advance
    markStepComplete();
    if (currentStep === guideSteps.length - 1) {
      handleFinishGuide();
    } else {
      const newStep = Math.min(currentStep + 1, guideSteps.length - 1);
      nextStep();
      // Persist for guests via localStorage
      if (!user) {
        localStorage.setItem("retro_learn_guide_step", newStep.toString());
      }
    }
  };
  useEffect(() => {
    const storedStep = localStorage.getItem("retro_learn_guide_step");
    if (storedStep !== null) {
      const step = parseInt(storedStep, 10);
      // If not logged in, sync to stored step
      if (!user && step !== currentStep) {
        goToStep(Math.min(step, guideSteps.length - 1));
        return;
      }
      // If we're still on the stored step after returning from a feature, advance to next
      if (step === currentStep && step < guideSteps.length - 1) {
        nextStep();
      }
    }
  }, [user, currentStep, goToStep, nextStep]);

  // Save progress when component unmounts
  useEffect(() => {
    return () => {
      forceSave();
    };
  }, [forceSave]);
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-terminal flex items-center justify-center p-4">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-lg font-retro text-primary">Loading...</p>
        </div>
      </div>;
  }
  const isLastStep = currentStep === guideSteps.length - 1;
  const isFirstStep = currentStep === 0;
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Simple Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={handleBackHome} className="font-retro gap-2">
            <ArrowLeft className="w-4 h-4" />
            Exit
          </Button>
          
          <div className="text-center">
            <p className="text-sm font-retro text-muted-foreground">
              Step {currentStep + 1} of {guideSteps.length}
            </p>
            <Progress value={progress} className="w-32 h-2 mt-1" />
          </div>
        </div>

        {/* Main Card - The Hero */}
        <Card className="p-8 md:p-12 bg-card/95 backdrop-blur border-2 border-primary shadow-neon mb-6">
          <div className="text-center space-y-6">
            {/* Big Emoji */}
            <div className="text-7xl md:text-8xl animate-bounce-slow">
              {currentGuideStep.emoji}
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-retro gradient-text-retro">
                {currentGuideStep.title}
              </h1>
              <p className="text-lg md:text-xl text-primary font-retro">
                {currentGuideStep.subtitle}
              </p>
            </div>

            {/* Description */}
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {currentGuideStep.description}
            </p>

            {/* Action Button */}
            {currentGuideStep.route && currentGuideStep.action && <div className="pt-4">
                <Button variant="default" size="lg" onClick={goToFeature} className="text-lg px-8 py-6" disabled={!user}>
                  <Rocket className="w-5 h-5 mr-2" />
                  {currentGuideStep.action}
                </Button>
                {!user && <p className="text-sm text-muted-foreground mt-2">
                    Please sign in to try this feature
                  </p>}
              </div>}
          </div>
        </Card>

        {/* Simple Navigation */}
        <div className="flex items-center justify-between gap-4">
          

          <Button variant="default" onClick={handleNextStep} size="lg" className="flex-1 max-w-xs text-center px-[220px] mx-[165px]">
            {isLastStep ? <>
                <Star className="w-4 h-4 mr-2" />
                Start Learning!
              </> : <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>}
          </Button>
        </div>

        {/* Mini step indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {guideSteps.map((_, index) => <button key={index} onClick={() => jumpToStep(index)} className={`w-2 h-2 rounded-full transition-all ${index === currentStep ? 'bg-primary w-8' : index < currentStep ? 'bg-primary/50' : 'bg-muted'}`} aria-label={`Go to step ${index + 1}`} />)}
        </div>
      </div>
    </div>
  );
};
export default UserGuide;