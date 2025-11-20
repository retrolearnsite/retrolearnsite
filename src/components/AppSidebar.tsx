import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Users,
  GraduationCap,
  FileText,
  HelpCircle,
  LogOut,
  LogIn,
  Moon,
  Sun,
  Compass,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from "@/components/ui/animated-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import retroLogo from "@/assets/vintage-tv-icon.png";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <Home className="text-foreground h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Notes",
    href: "/notes",
    icon: <FileText className="text-foreground h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Learn",
    href: "/learn",
    icon: <GraduationCap className="text-foreground h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Quizzes",
    href: "/quizzes",
    icon: <BookOpen className="text-foreground h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Work Rooms",
    href: "/workrooms",
    icon: <Users className="text-foreground h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Discover",
    href: "/discover",
    icon: <Compass className="text-foreground h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "User Guide",
    href: "/guide",
    icon: <HelpCircle className="text-foreground h-5 w-5 flex-shrink-0" />,
  },
];

function SidebarContent() {
  const { open } = useSidebar();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getUserDisplayName = () => {
    return (
      user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "User"
    );
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-3 mb-2">
          <img
            src={retroLogo}
            alt="RetroLearn Logo"
            className="h-10 w-10 flex-shrink-0"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: open ? 1 : 0,
              display: open ? "flex" : "none",
            }}
            className="flex flex-col flex-1"
          >
            <span className="font-retro text-lg glow-blue whitespace-nowrap">
              RetroLearn
            </span>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              Learn with Style
            </span>
          </motion.div>
          <motion.div
            animate={{
              opacity: open ? 1 : 0,
              display: open ? "block" : "none",
            }}
            className="ml-auto"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hover:bg-accent h-7 w-7"
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </Button>
          </motion.div>
        </div>

        {/* Navigation Links */}
        <div className="mt-4 flex flex-col gap-1">
          {navigationItems.map((link, idx) => (
            <SidebarLink key={idx} link={link} />
          ))}
        </div>
      </div>

      {/* Footer with User Info */}
      <div className="pt-4 border-t border-border">
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <motion.div
                animate={{
                  opacity: open ? 1 : 0,
                  display: open ? "flex" : "none",
                }}
                className="flex flex-col flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-foreground truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user.email}
                </p>
              </motion.div>
            </div>
            <motion.div
              animate={{
                opacity: open ? 1 : 0,
                display: open ? "block" : "none",
              }}
            >
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-xs"
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
              className="h-8 w-8 flex-shrink-0"
            >
              <LogIn className="h-4 w-4" />
            </Button>
            <motion.span
              animate={{
                opacity: open ? 1 : 0,
                display: open ? "inline" : "none",
              }}
              className="text-xs font-medium"
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
      <SidebarBody className="justify-between gap-4">
        <SidebarContent />
      </SidebarBody>
    </Sidebar>
  );
}
