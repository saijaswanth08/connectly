import { Calendar, Users, Bell, Video, Network, Clock, MessageSquare, Lightbulb, MessagesSquare, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { SidebarUserMenu } from "@/components/SidebarUserMenu";
import { ConnectlyLogoIcon } from "@/components/ConnectlyLogo";

const mainItems = [
  { title: "Contacts", url: "/dashboard", icon: Users },
  { title: "Messages", url: "/dashboard/messages", icon: MessagesSquare },
  { title: "Interactions", url: "/dashboard/interactions", icon: Calendar },
  { title: "Video Meetings", url: "/dashboard/video-meetings", icon: Video },
  { title: "Reminders", url: "/dashboard/reminders", icon: Bell },
  { title: "Network Map", url: "/dashboard/network", icon: Network },
];

const widgetItems = [
  { title: "Upcoming Follow-Ups", url: "/dashboard/follow-ups", icon: Clock },
  { title: "Recent Interactions", url: "/dashboard/recent-interactions", icon: MessageSquare },
  { title: "Networking Insights", url: "/dashboard/insights", icon: Lightbulb },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 dark:bg-slate-900 dark:border-slate-800">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
            <ConnectlyLogoIcon size={28} />
          </div>
          {!collapsed && (
            <span className="font-display text-[22px] font-bold tracking-tight bg-gradient-to-r from-[#5B7CFA] to-[#8B5CF6] bg-clip-text text-transparent">Connectly</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-800",
                          active ? "bg-indigo-600 text-white font-medium" : "text-sm text-slate-300 font-medium dark:text-gray-400"
                        )}
                      >
                        <item.icon className={cn("shrink-0 transition-all duration-200", active ? "h-5 w-5" : "h-5 w-5")} />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {widgetItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-slate-800 dark:hover:bg-slate-800",
                          active ? "bg-indigo-600 text-white font-medium" : "text-sm text-slate-300 font-medium dark:text-gray-400"
                        )}
                      >
                        <item.icon className={cn("shrink-0 transition-all duration-200", active ? "h-5 w-5" : "h-5 w-5")} />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <SidebarUserMenu />
      </SidebarFooter>
    </Sidebar>
  );
}
