import { Link } from "react-router-dom";
import { ArrowLeft, Zap, Users, Shield, Heart, Briefcase, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import illustrationNetworking from "@/assets/illustration-networking.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const audience = [
  { icon: Briefcase, label: "Entrepreneurs" },
  { icon: Users, label: "Business professionals" },
  { icon: TrendingUp, label: "Sales teams" },
  { icon: Shield, label: "Consultants" },
  { icon: Heart, label: "Freelancers" },
  { icon: Zap, label: "Event networkers" },
];

export default function AboutPage() {
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
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
          <motion.div initial="hidden" animate="visible" className="space-y-6">
            <motion.h1 custom={0} variants={fadeUp} className="font-display text-4xl font-bold text-foreground sm:text-5xl">
              About Connect<span className="text-primary">ly</span>
            </motion.h1>
            <motion.p custom={1} variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed">
              Connectly is a personal networking CRM designed for professionals who meet many people during conferences, meetings, and events.
            </motion.p>
            <motion.p custom={2} variants={fadeUp} className="text-muted-foreground leading-relaxed">
              Remembering every conversation and contact becomes difficult. Connectly helps you store contacts, notes, and relationship details in one organized workspace. Professionals can easily track interactions, remember conversations, and build stronger relationships.
            </motion.p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex justify-center"
          >
            <img src={illustrationNetworking} alt="Networking illustration" className="w-full max-w-sm" />
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-5 text-center">
            <motion.div custom={0} variants={fadeUp} className="mx-auto inline-flex rounded-xl bg-accent p-3">
              <Zap className="h-6 w-6 text-primary" />
            </motion.div>
            <motion.h2 custom={1} variants={fadeUp} className="font-display text-3xl font-bold text-foreground">
              Our Mission
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed">
              Our mission is to help professionals never forget an important connection. Networking is powerful, but remembering details is hard. Connectly ensures every relationship stays meaningful and organized.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4 text-center mb-12">
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-foreground">
              Who is it for?
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="text-muted-foreground text-lg">
              Built for anyone who values their professional network.
            </motion.p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {audience.map((item, i) => (
              <motion.div
                key={item.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i + 2}
                variants={fadeUp}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0 rounded-xl bg-accent p-3">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-display font-semibold text-foreground">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} NetworkMemory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
