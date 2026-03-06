import { useContactsStore } from "@/lib/contacts-store";
import { motion } from "framer-motion";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RemindersPage() {
  const reminders = useContactsStore((s) => s.reminders);
  const contacts = useContactsStore((s) => s.contacts);
  const toggleReminder = useContactsStore((s) => s.toggleReminder);

  const pending = reminders.filter((r) => !r.completed);
  const completed = reminders.filter((r) => r.completed);

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Reminders</h1>
        <p className="text-sm text-muted-foreground">{pending.length} pending follow-ups</p>
      </div>

      <div className="space-y-3">
        {pending.map((r, i) => {
          const contact = contacts.find((c) => c.id === r.contactId);
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl px-5 py-4 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{r.message}</p>
                <p className="text-xs text-muted-foreground">{contact?.name} · Due: {r.date}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => toggleReminder(r.id)} className="gap-1.5">
                <Check className="h-3.5 w-3.5" /> Done
              </Button>
            </motion.div>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-muted-foreground mb-3">Completed</h2>
          <div className="space-y-2">
            {completed.map((r) => {
              const contact = contacts.find((c) => c.id === r.contactId);
              return (
                <div key={r.id} className="glass-card rounded-xl px-5 py-3 opacity-50 flex items-center justify-between">
                  <div>
                    <p className="text-sm line-through">{r.message}</p>
                    <p className="text-xs text-muted-foreground">{contact?.name}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => toggleReminder(r.id)} className="text-xs">Undo</Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
