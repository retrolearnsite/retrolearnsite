import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function EmailConfirmationBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && !user.email_confirmed_at) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [user]);

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: "Please check your inbox for the confirmation link.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm border-b-2 border-yellow-500 scanlines">
      <Alert className="max-w-4xl mx-auto bg-card/95 border-2 border-yellow-500 shadow-lg shadow-yellow-500/20">
        <Mail className="h-5 w-5 text-yellow-500" />
        <AlertTitle className="font-retro text-lg glow-text text-yellow-500 mb-2">
          ⚠️ EMAIL VERIFICATION REQUIRED ⚠️
        </AlertTitle>
        <AlertDescription className="font-retro text-sm space-y-3">
          <p className="text-foreground">
            Please check your email inbox and click the confirmation link to activate your account.
            Without confirmation, some features may be limited.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              variant="outline"
              size="sm"
              className="font-retro border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
            >
              {isResending ? "SENDING..." : "RESEND EMAIL"}
            </Button>
            <span className="text-xs text-muted-foreground">
              Didn't receive it? Check your spam folder.
            </span>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
