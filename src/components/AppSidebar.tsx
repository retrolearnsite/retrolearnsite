import { Home, FileText, Users, Trophy, GraduationCap, BookOpen, BarChart, User, LogOut, Sparkles } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import mascotImage from "@/assets/retro-wizard-mascot.jpg";
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={mascotImage} alt="App Logo" className="w-8 h-8 rounded-md" />
          </div>
          {open && <div>
              <h2 className="text-sm font-semibold text-sidebar-foreground">Study Platform</h2>
              <p className="text-xs text-muted-foreground">
                AI Learning Tools
              </p>
            </div>}
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

      <SidebarFooter className="border-t-2 border-primary/50 p-4">
        {user ? <div className="space-y-2">
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="w-8 h-8 border-2 border-primary">
                <AvatarFallback className="bg-primary/20 text-primary font-retro text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              {open && <div className="flex-1 min-w-0">
                  <p className="font-retro text-xs font-semibold text-foreground truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="font-retro text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>}
            </div>
            {open && <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full font-retro text-xs border-primary/50 hover:bg-destructive/20 hover:text-destructive hover:border-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                LOGOUT
              </Button>}
          </div> : <Button variant="default" size="sm" onClick={() => navigate('/')} className="w-full text-xs">
            <User className="w-4 h-4 mr-2" />
            {open ? 'LOGIN' : ''}
          </Button>}
      </SidebarFooter>
    </Sidebar>;
}