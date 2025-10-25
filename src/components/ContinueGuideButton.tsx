import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserGuideProgress } from "@/hooks/useUserGuideProgress";

const GUIDE_STORAGE_KEY = "retro_learn_guide_step";

export const ContinueGuideButton = () => {
  const [showButton, setShowButton] = useState(false);
  const [nextStep, setNextStep] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentStep, isLoading } = useUserGuideProgress();

  useEffect(() => {
    if (user) {
      if (!isLoading) {
        const ns = Math.min(currentStep + 1, 7);
        setNextStep(ns);
        setShowButton(currentStep > 0);
      }
    } else {
      const storedStep = localStorage.getItem(GUIDE_STORAGE_KEY);
      if (storedStep !== null) {
        const step = parseInt(storedStep, 10);
        setNextStep(step + 1);
        setShowButton(true);
      }
    }
  }, [user, isLoading, currentStep]);

  const handleContinue = () => {
    if (nextStep !== null) {
      if (!user) {
        localStorage.setItem(GUIDE_STORAGE_KEY, nextStep.toString());
      }
      navigate("/user-guide");
    }
  };

  if (!showButton) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <Button
        onClick={handleContinue}
        size="lg"
        variant="neon"
        className="font-retro shadow-neon gap-2"
      >
        <BookOpen className="w-5 h-5" />
        Continue Guide
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
};

export const setGuideStep = (step: number) => {
  localStorage.setItem(GUIDE_STORAGE_KEY, step.toString());
};

export const clearGuideStep = () => {
  localStorage.removeItem(GUIDE_STORAGE_KEY);
};
