import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserGuideProgress } from "@/hooks/useUserGuideProgress";

const GUIDE_STORAGE_KEY = "retro_learn_guide_step";
const GUIDE_COMPLETED_KEY = "retro_learn_guide_completed";
const TOTAL_STEPS = 7; // keep in sync with guideSteps.length
const LAST_INDEX = TOTAL_STEPS - 1;

export const ContinueGuideButton = () => {
  const [showButton, setShowButton] = useState(false);
  const [nextStep, setNextStep] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { currentStep, isLoading, completedSteps } = useUserGuideProgress();

  useEffect(() => {
    if (user) {
      if (!isLoading) {
        const ns = Math.min(currentStep + 1, LAST_INDEX);
        setNextStep(ns);
        const isCompleted = currentStep >= LAST_INDEX && completedSteps.has(LAST_INDEX);
        setShowButton(currentStep > 0 && !isCompleted);
      }
    } else {
      const completedFlag = localStorage.getItem(GUIDE_COMPLETED_KEY) === "true";
      if (completedFlag) {
        setShowButton(false);
        setNextStep(null);
        return;
      }
      const storedStep = localStorage.getItem(GUIDE_STORAGE_KEY);
      if (storedStep !== null) {
        const step = parseInt(storedStep, 10);
        setNextStep(Math.min(step + 1, LAST_INDEX));
        setShowButton(step >= 0 && step < LAST_INDEX);
      } else {
        setShowButton(false);
        setNextStep(null);
      }
    }
  }, [user, isLoading, currentStep, completedSteps]);

  const handleContinue = () => {
    if (nextStep !== null) {
      if (!user) {
        localStorage.setItem(GUIDE_STORAGE_KEY, nextStep.toString());
      }
      navigate("/user-guide");
    }
  };

  if (location.pathname.startsWith("/user-guide")) return null;
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

export const markGuideCompleted = () => {
  localStorage.setItem(GUIDE_COMPLETED_KEY, "true");
};

export const clearGuideCompleted = () => {
  localStorage.removeItem(GUIDE_COMPLETED_KEY);
};
