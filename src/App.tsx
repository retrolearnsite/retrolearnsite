import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Home from "./pages/Home";
import NoteWizard from "./pages/NoteWizard";
import Notes from "./pages/Notes";
import WorkRooms from "./pages/WorkRooms";
import WorkRoom from "./pages/WorkRoom";
import Quizzes from "./pages/Quizzes";
import Learn from "./pages/Learn";
import UserGuide from "./pages/UserGuide";
import ApiUsage from "./pages/ApiUsage";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { Menu } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-gradient-terminal">
          <AppSidebar />
          <div className="flex-1 flex flex-col w-full">
            <header className="sticky top-0 z-50 h-14 border-b-2 border-primary/50 bg-card/95 backdrop-blur-sm flex items-center px-4 gap-4">
              <SidebarTrigger className="font-retro">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>
              <div className="flex-1">
                <h1 className="font-retro text-sm font-bold glow-text">
                  RETRO NOTE WIZARD
                </h1>
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/note-wizard" element={<NoteWizard />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/workrooms" element={<WorkRooms />} />
                <Route path="/workroom/:roomId" element={<WorkRoom />} />
                <Route path="/quizzes" element={<Quizzes />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/user-guide" element={<UserGuide />} />
                <Route path="/api-usage" element={<ApiUsage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
