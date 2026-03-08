import { Link } from "react-router-dom";
import { ArrowLeft, Users, FileText, Bell, Mic, Search, Video, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: Users, title: "Contact Management", desc: "Save every person you meet with full context — company, role, tags, and custom notes. Organize contacts by importance level." },
  { icon: FileText, title: "Meeting Notes", desc: "Record what you talked about, where you met, and what opportunities emerged from every conversation." },
  { icon: Bell, title: "Smart Follow-ups", desc: "Set reminders to reconnect at the right time and never let a relationship go cold." },
  { icon: Mic, title: "Voice Notes", desc: "Record voice memos for conversations and attach them to specific contacts for future reference." },
  { icon: Search, title: "Smart Search", desc: "Find any contact instantly with powerful search across names, companies, tags, and notes." },
  { icon: Video, title: "Meeting Links", desc: "Store and manage Zoom, Google Meet, and other video meeting links for your scheduled meetings." },
  { icon: Link2, title: "LinkedIn Integration", desc: "Link your contacts' LinkedIn profiles for quick access to their professional information." },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background font-body">
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
        </div>
      </nav>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div initial="hidden" animate="visible" className="space-y-6 text-center mb-14">
            <motion.h1 custom={0} variants={fadeUp} className="font-display text-4xl font-bold text-foreground">
              Features
            </motion.h1>
            <motion.p custom={1} variants={fadeUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build and maintain your professional network, all in one place.
            </motion.p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                animate="visible"
                custom={i + 2}
                variants={fadeUp}
                className="rounded-2xl border border-border bg-card p-7 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex rounded-xl bg-accent p-3">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
