import { useContactsStore } from "@/lib/contacts-store";
import { monthlyContactsData, meetingTypesData, tagDistribution } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";

export default function AnalyticsPage() {
  const contacts = useContactsStore((s) => s.contacts);
  const meetings = useContactsStore((s) => s.meetings);

  const priorityData = [
    { name: "VIP", value: contacts.filter((c) => c.priority === "vip").length, fill: "hsl(var(--vip))" },
    { name: "High", value: contacts.filter((c) => c.priority === "high").length, fill: "hsl(var(--high))" },
    { name: "Medium", value: contacts.filter((c) => c.priority === "medium").length, fill: "hsl(var(--medium))" },
    { name: "Low", value: contacts.filter((c) => c.priority === "low").length, fill: "hsl(var(--low))" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Networking insights and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5">
          <h2 className="font-display font-semibold mb-4">Contacts Added Per Month</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyContactsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="contacts" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <h2 className="font-display font-semibold mb-4">Meeting Types Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={meetingTypesData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {meetingTypesData.map((e, i) => <Cell key={i} fill={e.fill} />)}
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

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
          <h2 className="font-display font-semibold mb-4">Contact Priority Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {priorityData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-5">
          <h2 className="font-display font-semibold mb-4">Tags Distribution</h2>
          <div className="space-y-3">
            {tagDistribution.map((t) => (
              <div key={t.tag} className="flex items-center gap-3">
                <span className="text-sm w-20 text-muted-foreground">{t.tag}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(t.count / Math.max(...tagDistribution.map((d) => d.count))) * 100}%` }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="h-full bg-primary/70 rounded-full"
                  />
                </div>
                <span className="text-sm font-medium w-6 text-right">{t.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
