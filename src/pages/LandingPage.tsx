import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, FileText, Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-networking.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: Users,
    title: "Contact Memory",
    description: "Save every person you meet with full context — company, role, tags, and custom notes.",
  },
  {
    icon: FileText,
    title: "Meeting Notes",
    description: "Record what you talked about, where you met, and what opportunities emerged.",
  },
  {
    icon: Bell,
    title: "Smart Follow-ups",
    description: "Set reminders to reconnect at the right time and never let a relationship go cold.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-body">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="font-display text-xl font-bold text-foreground tracking-tight">
            Network<span className="text-primary">Memory</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" className="rounded-full px-5" asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.h1
              custom={0}
              variants={fadeUp}
              className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-[3.25rem]"
            >
              Organize Every{" "}
              <span className="text-gradient">Relationship</span>{" "}
              You Build
            </motion.h1>
            <motion.p
              custom={1}
              variants={fadeUp}
              className="max-w-lg text-lg text-muted-foreground"
            >
              We help you organize social interactions, manage contacts, schedule follow-ups, and strengthen professional relationships.
            </motion.p>
            <motion.div custom={2} variants={fadeUp} className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" className="rounded-full gap-2 px-7 text-base" asChild>
                <Link to="/signup">
                  Sign Up For Free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-7 text-base" asChild>
                <a href="#about">Learn More</a>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex justify-center"
          >
            <img
              src={heroImage}
              alt="Professional networking and relationship management illustration"
              className="w-full max-w-lg rounded-2xl shadow-xl"
            />
          </motion.div>
        </div>
      </section>

      {/* About / Features */}
      <section id="about" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto max-w-2xl text-center space-y-4 mb-14"
          >
            <motion.h2
              custom={0}
              variants={fadeUp}
              className="font-display text-3xl font-bold text-foreground sm:text-4xl"
            >
              What Is Our Platform About?
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="text-muted-foreground text-lg">
              Our platform is designed for professionals who meet many people every day. It helps store contact details, meeting notes, and reminders so you can maintain strong relationships and never forget important connections.
            </motion.p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={i}
                variants={fadeUp}
                className="group rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md hover:glow-emerald"
              >
                <div className="mb-4 inline-flex rounded-xl bg-accent p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <span className="font-display text-lg font-bold text-foreground">
              Network<span className="text-primary">Memory</span>
            </span>
            <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <a href="#about" className="hover:text-foreground transition-colors">About</a>
              <a href="#about" className="hover:text-foreground transition-colors">Features</a>
              <Link to="/dashboard" className="hover:text-foreground transition-colors">Contact</Link>
              <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
            </nav>
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} NetworkMemory. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
