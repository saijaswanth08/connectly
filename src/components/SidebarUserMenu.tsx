import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HelpCircle,
  LogOut,
  ChevronsUpDown,
  Bug,
  Moon,
  Sun,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarUserMenu() {
  const { signOut } = useAuth();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const { data: profile, isLoading } = useProfile();

  const displayName = profile?.name || "User";
  const displayEmail = profile?.email || "";

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-sidebar-accent/50 focus-visible:ring-2 focus-visible:ring-ring">
          {/* Avatar */}
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="rounded-full w-10 h-10 object-cover" />
          ) : (
            <div className="rounded-full w-10 h-10 bg-primary/15 text-primary flex items-center justify-center font-semibold">
              {profile?.name?.charAt(0) || "U"}
            </div>
          )}

          {/* Name + email (hidden when sidebar is collapsed) */}
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <>
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-2.5 w-32" />
                  </>
                ) : (
                  <div className="flex flex-col justify-center">
                    <p className="text-sm font-medium text-sidebar-accent-foreground truncate leading-tight">
                      {displayName}
                    </p>
                    {displayEmail && (
                      <p className="text-xs text-sidebar-foreground truncate mt-0.5">
                        {displayEmail}
                      </p>
                    )}
                  </div>
                )}
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
        <DropdownMenuItem onClick={() => handleNavigate("/support")}>
          <HelpCircle className="mr-2 h-4 w-4" />
          Help & Support
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNavigate("/report-issue")}>
          <Bug className="mr-2 h-4 w-4" />
          Report an Issue
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setTheme(isDark ? "light" : "dark");
          }}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center">
            {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            <span>Dark Mode</span>
          </div>
          <Switch checked={isDark} className="scale-75 pointer-events-none" />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={signOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
