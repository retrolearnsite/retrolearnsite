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

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-2">
            <img
              src={retroLogo}
              alt="RetroLearn Logo"
              className="h-10 w-10 flex-shrink-0"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: sidebarOpen ? 1 : 0 }}
              className="flex flex-col"
            >
              <span className="font-retro text-xl glow-blue whitespace-nowrap">
                RetroLearn
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Learn with Style
              </span>
            </motion.div>
            <motion.div animate={{ opacity: sidebarOpen ? 1 : 0 }} className="ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:bg-accent h-8 w-8"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          </div>

          {/* Navigation Links */}
          <div className="mt-8 flex flex-col gap-2">
            {navigationItems.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>

        {/* Footer with User Info */}
        <div>
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  animate={{
                    opacity: sidebarOpen ? 1 : 0,
                    display: sidebarOpen ? "flex" : "none",
                  }}
                  className="flex flex-col flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-foreground truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </motion.div>
              </div>
              <motion.div
                animate={{
                  opacity: sidebarOpen ? 1 : 0,
                  display: sidebarOpen ? "block" : "none",
                }}
              >
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </motion.div>
            </div>
          ) : (
            <Button
              onClick={() => navigate("/")}
              variant="default"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <LogIn className="h-4 w-4 flex-shrink-0" />
              <motion.span
                animate={{
                  opacity: sidebarOpen ? 1 : 0,
                  display: sidebarOpen ? "inline" : "none",
                }}
              >
                Sign In
              </motion.span>
            </Button>
          )}
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
