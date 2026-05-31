import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import { FloatingQuickAdd } from "@/components/FloatingQuickAdd";
import { useKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeContactRequests } from "@/hooks/useRealtimeContactRequests";
import { useRealtimeContacts } from "@/hooks/useRealtimeContacts";
import { usePresence } from "@/hooks/usePresence";
import { useEffect } from "react";
import { IncompleteProfileBanner } from "@/components/IncompleteProfileBanner";
import { useProfile } from "@/hooks/useProfile";
import { Navigate } from "react-router-dom";

export function AppLayout() {
  useKeyboardShortcuts();
  const location = useLocation();
  const { user } = useAuth();
  useRealtimeContactRequests(user?.id);
  useRealtimeContacts(user?.id);
  usePresence(); // Enable global presence tracking while in dashboard
  
  const { data: profile, isLoading } = useProfile();
  
  // Enforce profile completion before accessing other features
  const isProfileIncomplete = profile && (!profile.company || !profile.job_title || !profile.phone);
  const allowedPaths = ["/dashboard/profile-settings", "/dashboard/settings", "/support", "/report-issue"];
  
  if (!isLoading && isProfileIncomplete && !allowedPaths.includes(location.pathname)) {
    return <Navigate to="/dashboard/profile-settings" replace />;
  }
  
  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-muted/30 overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between px-6 bg-background dark:bg-slate-900 border-b dark:border-slate-800 shadow-sm shrink-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-2" />
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NotificationBell />
              <ProfileDropdown />
            </div>
          </header>
          <IncompleteProfileBanner />
          <main className="flex-1 overflow-auto min-h-0 main-viewport-scroll">
            <Outlet />
          </main>
        </div>
        {location.pathname === "/dashboard" && <FloatingQuickAdd />}
      </div>
    </SidebarProvider>
  );
}
