import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ProfileDropdown() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useProfile();

  const displayName = profile?.name || "User";
  const displayEmail = profile?.email || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-transform hover:scale-105">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="rounded-full w-10 h-10 object-cover" />
          ) : (
            <div className="rounded-full w-10 h-10 bg-primary/15 text-primary flex items-center justify-center font-semibold">
              {profile?.name?.charAt(0) || "U"}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[220px] rounded-xl shadow-lg">
        {/* Mini profile header */}
        <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/40">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="rounded-full w-10 h-10 object-cover shrink-0" />
          ) : (
            <div className="shrink-0 rounded-full w-10 h-10 bg-primary/15 text-primary flex items-center justify-center font-semibold">
              {profile?.name?.charAt(0) || "U"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
          </div>
        </div>

        <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
          <User className="mr-2 h-4 w-4" /> My Profile
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
          <KeyRound className="mr-2 h-4 w-4" /> Account Security
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={signOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
