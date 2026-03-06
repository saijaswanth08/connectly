import { Users, Star, Bell, Calendar, TrendingUp, UserPlus } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { ContactCard } from "@/components/ContactCard";
import { useContactsStore } from "@/lib/contacts-store";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { monthlyContactsData, meetingTypesData } from "@/lib/mock-data";

export default function DashboardPage() {
  const contacts = useContactsStore((s) => s.contacts);
  const reminders = useContactsStore((s) => s.reminders);
  const meetings = useContactsStore((s) => s.meetings);

  const vipCount = contacts.filter((c) => c.importance === "vip").length;
  const pendingReminders = reminders.filter((r) => !r.completed).length;
  const recentContacts = contacts.slice(0, 4);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your networking overview at a glance</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} title="Total Contacts" value={contacts.length} trend="+15% this month" variant="glow" />
        <MetricCard icon={Star} title="VIP Contacts" value={vipCount} subtitle="Top priority" />
        <MetricCard icon={Bell} title="Pending Reminders" value={pendingReminders} subtitle="Action needed" />
        <MetricCard icon={Calendar} title="Meetings" value={meetings.length} trend="+3 this week" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
          <h2 className="font-display font-semibold mb-4">Network Growth</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyContactsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="contacts" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-5">
          <h2 className="font-display font-semibold mb-4">Meeting Types</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={meetingTypesData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                {meetingTypesData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {meetingTypesData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                {d.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold">Recent Contacts</h2>
          <a href="/contacts" className="text-sm text-primary hover:underline">View all →</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentContacts.map((c, i) => (
            <ContactCard key={c.id} contact={c} index={i} />
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h2 className="font-display font-semibold mb-3">Upcoming Reminders</h2>
        <div className="space-y-2">
          {reminders.filter((r) => !r.completed).slice(0, 3).map((r) => {
            const contact = contacts.find((c) => c.id === r.contactId);
            return (
              <div key={r.id} className="glass-card rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{r.message}</p>
                  <p className="text-xs text-muted-foreground">{contact?.name} · {r.date}</p>
                </div>
                <Bell className="h-4 w-4 text-primary" />
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
