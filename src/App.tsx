import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { EmailConfirmationBanner } from "@/components/EmailConfirmationBanner";
import { ThemeProvider } from "next-themes";
import Home from "./pages/Home";
import NoteWizard from "./pages/NoteWizard";
import Notes from "./pages/Notes";
import WorkRooms from "./pages/WorkRooms";
import WorkRoom from "./pages/WorkRoom";
import Discover from "./pages/Discover";
import Quizzes from "./pages/Quizzes";
import Learn from "./pages/Learn";
import UserGuide from "./pages/UserGuide";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <TooltipProvider>
            <div className="flex min-h-screen w-full bg-background items-center justify-center">
              <div className="text-primary">Loading...</div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  // If user is not authenticated, show pages without sidebar
  if (!user) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <EmailConfirmationBanner />
          <Toaster />
          <Sonner />
            <div className="min-h-screen w-full bg-background">
              <main className="flex-1 overflow-y-auto min-h-0">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </main>
            </div>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  // Authenticated users see the full app with sidebar
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <TooltipProvider>
          <EmailConfirmationBanner />
          <Toaster />
          <Sonner />
          <div className="flex min-h-svh w-full bg-background">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto md:ml-[80px]">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/note-wizard" element={<NoteWizard />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/workrooms" element={<WorkRooms />} />
                <Route path="/workroom/:roomId" element={<WorkRoom />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/quizzes" element={<Quizzes />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/guide" element={<UserGuide />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;