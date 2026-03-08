import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Settings,
  HelpCircle,
  Moon,
  LogOut,
  ChevronsUpDown,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarUserMenu() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const fullName = profile?.name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const email = profile?.email || user?.email || "";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = profile?.avatar_url || null;
  const isDark = theme === "dark";

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  const toggleDarkMode = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-sidebar-accent/50 focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-8 w-8 shrink-0">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{fullName}</p>
                <p className="text-[10px] text-sidebar-foreground truncate">{email}</p>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-[220px] mb-1"
        sideOffset={8}
      >
        <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
          <User className="mr-2 h-4 w-4" />
          Profile Settings
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Account Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Help & Support */}
        <DropdownMenuItem onClick={() => navigate("/help")}>
          <HelpCircle className="mr-2 h-4 w-4" />
          Help Center
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/report-issue")}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Report Issue
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/support")}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Contact Support
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Dark Mode Toggle */}
        <div
          className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
          onClick={toggleDarkMode}
        >
          <div className="flex items-center">
            <Moon className="mr-2 h-4 w-4" />
            Dark Mode
          </div>
          <Switch checked={isDark} onCheckedChange={() => toggleDarkMode()} className="scale-75" />
        </div>

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
