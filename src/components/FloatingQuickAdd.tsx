import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Calendar, Bell, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AddContactDialog } from "@/components/AddContactDialog";

const actions = [
  { label: "Add Contact", icon: Users, action: "contact" as const },
  { label: "Add Interaction", icon: Calendar, url: "/dashboard/interactions" },
  { label: "Add Reminder", icon: Bell, url: "/dashboard/reminders" },
  { label: "New Message", icon: MessageSquare, url: "/dashboard/messages" },
] as const;

export function FloatingQuickAdd() {
  const [open, setOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const navigate = useNavigate();

  function handleAction(action: typeof actions[number]) {
    setOpen(false);
    if ("action" in action && action.action === "contact") {
      setAddContactOpen(true);
    } else if ("url" in action) {
      navigate(action.url);
    }
  }

  return (
    <>
      <AddContactDialog open={addContactOpen} onClose={() => setAddContactOpen(false)} />

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {open &&
            actions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ delay: i * 0.04, duration: 0.15 }}
                className="flex items-center gap-2.5 rounded-full bg-card border border-border shadow-lg px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                onClick={() => handleAction(action)}
              >
                <action.icon className="h-4 w-4 text-primary" />
                {action.label}
              </motion.button>
            ))}
        </AnimatePresence>

        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-all duration-200",
            "bg-indigo-600 text-white hover:opacity-90",
            open && "rotate-45"
          )}
          style={{ position: "static" }}
          aria-label="Quick add"
        >
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}
