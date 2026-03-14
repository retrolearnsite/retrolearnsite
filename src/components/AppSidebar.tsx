import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home, BookOpen, Users, GraduationCap, FileText, HelpCircle, LogOut, LogIn, Compass,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
  Sidebar, SidebarBody, SidebarLink, useSidebar,
} from "@/components/ui/animated-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import retroLogo from "@/assets/vintage-tv-icon.png";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: <Home className="text-foreground h-5 w-5 flex-shrink-0" /> },
  { label: "Notes", href: "/notes", icon: <FileText className="text-foreground h-5 w-5 flex-shrink-0" /> },
  { label: "Learn", href: "/learn", icon: <GraduationCap className="text-foreground h-5 w-5 flex-shrink-0" /> },
  { label: "Quizzes", href: "/quizzes", icon: <BookOpen className="text-foreground h-5 w-5 flex-shrink-0" /> },
  { label: "Work Rooms", href: "/workrooms", icon: <Users className="text-foreground h-5 w-5 flex-shrink-0" /> },
  { label: "Discover", href: "/discover", icon: <Compass className="text-foreground h-5 w-5 flex-shrink-0" /> },
  { label: "User Guide", href: "/guide", icon: <HelpCircle className="text-foreground h-5 w-5 flex-shrink-0" /> },
];

function SidebarContent() {
  const { open } = useSidebar();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getUserDisplayName = () =>
    user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const getUserInitials = () =>
    getUserDisplayName().split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-3 mb-2 flex-shrink-0">
          <motion.img
            src={retroLogo}
            alt="RetroLearn Logo"
            className="flex-shrink-0 object-contain"
            initial={false}
            animate={{ width: open ? 32 : 20, height: open ? 32 : 20 }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: open ? 1 : 0, display: open ? "flex" : "none" }}
            className="flex flex-col flex-1"
          >
            <span className="font-display text-xl font-bold whitespace-nowrap">
              Retro<span className="text-primary">Learn</span>
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] whitespace-nowrap">
              Learn with Style
            </span>
          </motion.div>
        </div>

        {/* Section Label */}
        <motion.div
          animate={{ opacity: open ? 1 : 0, display: open ? "flex" : "none" }}
          className="flex items-center gap-2 px-3 mt-4 mb-2"
        >
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.1em]">Navigation</span>
          <span className="flex-1 border-t border-border/50" />
        </motion.div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          {navigationItems.map((link, idx) => {
            const isActive = location.pathname === link.href;
            return (
              <div
                key={idx}
                className="relative transition-colors duration-150"
                style={{
                  borderLeft: isActive ? '3px solid var(--crt-orange)' : '3px solid transparent',
                  background: isActive ? 'rgba(232,98,42,0.08)' : 'transparent',
                  borderRadius: '0 2px 2px 0',
                }}
              >
                <SidebarLink link={link} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-border/30 flex-shrink-0">
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8 flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--crt-orange), var(--crt-yellow))' }}>
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-transparent text-background text-[10px] font-mono font-bold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <motion.div
                animate={{ opacity: open ? 1 : 0, display: open ? "flex" : "none" }}
                className="flex flex-col flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-foreground truncate">{getUserDisplayName()}</p>
                <p className="text-[10px] text-muted-foreground truncate font-mono">{user.email}</p>
              </motion.div>
            </div>
            <motion.div animate={{ opacity: open ? 1 : 0, display: open ? "block" : "none" }}>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs font-mono uppercase tracking-[0.06em] border-border/50 hover:border-primary/30 hover:text-primary"
                style={{ borderRadius: '4px' }}
              >
                <LogOut className="h-3 w-3" />
                Sign Out
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2">
            <Button
              onClick={() => navigate("/")}
              variant="default"
              size="icon"
              className="h-8 w-8 flex-shrink-0 bg-primary text-primary-foreground hover:bg-crt-yellow hover:text-background"
              style={{ borderRadius: '4px' }}
            >
              <LogIn className="h-4 w-4" />
            </Button>
            <motion.span
              animate={{ opacity: open ? 1 : 0, display: open ? "inline" : "none" }}
              className="text-xs font-mono uppercase tracking-[0.06em]"
            >
              Sign In
            </motion.span>
          </div>
        )}
      </div>
    </>
  );
}

export function AppSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-4 h-screen" style={{ borderRight: '1px solid rgba(232,98,42,0.15)' }}>
        <SidebarContent />
      </SidebarBody>
    </Sidebar>
  );
}
