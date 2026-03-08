import { Link } from "react-router-dom";
import { ArrowLeft, Users, FileText, Bell, Mic, Search, Video, Link2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import illustrationDashboard from "@/assets/illustration-dashboard.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: Users, title: "Contact Management", desc: "Store professional contacts in one place with full context — company, role, tags, and custom notes." },
  { icon: FileText, title: "Meeting Notes", desc: "Add notes about meetings and conversations so you never forget what was discussed." },
  { icon: Search, title: "Smart Search", desc: "Quickly find any contact using names, companies, or tags with powerful instant search." },
  { icon: Bell, title: "Reminders", desc: "Set reminders for follow-ups and meetings to keep every relationship warm." },
  { icon: Link2, title: "LinkedIn Integration", desc: "Import contacts directly from LinkedIn for seamless professional networking." },
  { icon: Mic, title: "Voice Notes", desc: "Record quick voice memos after meetings and attach them to contacts." },
  { icon: GitBranch, title: "Relationship Tracking", desc: "Track how and where you met each contact to build a rich relationship history." },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background font-body">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
          <Link to="/" className="font-display text-lg font-bold text-foreground">
            Connect<span className="text-primary">ly</span>
          </Link>
          <div className="w-20" />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.06),transparent)]" />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <motion.div initial="hidden" animate="visible" className="space-y-4">
            <motion.h1 custom={0} variants={fadeUp} className="font-display text-4xl font-bold text-foreground sm:text-5xl">
              Powerful Features for Managing Your Professional Network
            </motion.h1>
            <motion.p custom={1} variants={fadeUp} className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Everything you need to build, maintain, and grow your professional relationships — all in one place.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid + Illustration */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-start gap-14 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-5 sm:grid-cols-2">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  variants={fadeUp}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="inline-flex rounded-xl bg-accent p-3">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="hidden lg:flex sticky top-24 justify-center"
            >
              <img src={illustrationDashboard} alt="Dashboard illustration" className="w-full max-w-xs rounded-xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Connectly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
