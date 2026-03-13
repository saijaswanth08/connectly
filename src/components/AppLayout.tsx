import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileDropdown } from "@/components/ProfileDropdown";

import { GlobalSearch } from "@/components/GlobalSearch";
import { FloatingQuickAdd } from "@/components/FloatingQuickAdd";
import { usePresenceTracker } from "@/hooks/usePresence";
import { useKeyboardShortcuts } from "@/components/KeyboardShortcuts";

export function AppLayout() {
  usePresenceTracker();
  useKeyboardShortcuts();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between px-6 bg-white border-b shadow-sm sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-2" />
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <ProfileDropdown />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
        <FloatingQuickAdd />
      </div>
    </SidebarProvider>
  );
}
