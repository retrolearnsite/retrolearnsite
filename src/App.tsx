import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
