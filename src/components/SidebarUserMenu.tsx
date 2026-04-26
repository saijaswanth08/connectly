import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  BookOpen,
  Bug,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarUserMenu() {
  const { signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();

  const { data: profile, isLoading } = useProfile();

  const displayName = profile?.name || "User";
  const displayEmail = profile?.email || "";

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
                  <>
                    <p className="text-xs font-medium text-sidebar-accent-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-sidebar-foreground truncate">
                      {displayEmail}
                    </p>
                  </>
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
        <DropdownMenuItem onClick={() => navigate("/help")}>
          <BookOpen className="mr-2 h-4 w-4" />
          Help Center
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/report-issue")}>
          <Bug className="mr-2 h-4 w-4" />
          Report a Bug
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/support")}>
          <HelpCircle className="mr-2 h-4 w-4" />
          Get Help
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
