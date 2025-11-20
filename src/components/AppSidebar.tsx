import { Home, FileText, Users, Trophy, GraduationCap, BookOpen, BarChart, User, LogOut, Moon, Sun } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import mascotImage from "@/assets/retro-wizard-mascot.jpg";
import retroLogo from '@/assets/retro-learn-logo.png';
const navigationItems = [{
  title: "Home",
  url: "/",
  icon: Home
}, {
  title: "My Notes",
  url: "/notes",
  icon: FileText
}, {
  title: "Work Rooms",
  url: "/workrooms",
  icon: Users
}, {
  title: "Quizzes",
  url: "/quizzes",
  icon: Trophy
}, {
  title: "Learn",
  url: "/learn",
  icon: GraduationCap
}, {
  title: "User Guide",
  url: "/user-guide",
  icon: BookOpen
}, {
  title: "Dashboard",
  url: "/dashboard",
  icon: BarChart
}];
export function AppSidebar() {
  const {
    open
  } = useSidebar();
  const {
    user,
    signOut
  } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  const getUserDisplayName = () => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Guest';
  };
  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.slice(0, 2).toUpperCase();
  };
  return <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={retroLogo} alt="Retro Learn Logo" className="w-8 h-8 rounded-md" />
            </div>
            {open && <div>
                <h2 className="text-sm font-semibold text-sidebar-foreground">Retro Learn</h2>
                <p className="text-xs text-muted-foreground">
                  AI Learning Tools
                </p>
              </div>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === '/'} className={({
                  isActive
                }) => `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                      <item.icon className="w-4 h-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {user ? <div className="space-y-2">
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="w-8 h-8 border border-sidebar-border">
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {open && <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>}
            </div>
            {open && <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent text-xs">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>}
          </div> : <Button variant="default" size="sm" onClick={() => navigate('/')} className="w-full text-xs">
              <User className="w-4 h-4 mr-2" />
              {open ? 'Sign In' : ''}
            </Button>}
      </SidebarFooter>
    </Sidebar>;
}