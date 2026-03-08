import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users, FileText, Bell, ArrowRight, Check, Mic, Search, Video, Link2, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-remember.png";
import featureNetwork from "@/assets/feature-network.png";
import featureDashboard from "@/assets/feature-dashboard.png";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: "easeOut" as const },
  }),
};

const stats = [
  { value: "50,000+", label: "Users" },
  { value: "500,000+", label: "Contacts stored" },
  { value: "120,000+", label: "Meetings recorded" },
  { value: "80,000+", label: "Reminders created" },
];

const features = [
  { icon: Users, title: "Contact Memory", description: "Save every person you meet with full context — company, role, tags, and custom notes." },
  { icon: FileText, title: "Meeting Notes", description: "Record what you talked about, where you met, and what opportunities emerged." },
  { icon: Bell, title: "Smart Follow-ups", description: "Set reminders to reconnect at the right time and never let a relationship go cold." },
];

const featureChecks = [
  { icon: Users, text: "Contact management" },
  { icon: FileText, text: "Meeting notes" },
  { icon: Mic, text: "Voice notes for conversations" },
  { icon: Link2, text: "LinkedIn contact import" },
  { icon: Search, text: "Smart contact search" },
  { icon: Video, text: "Video meetings with clients" },
  { icon: Bell, text: "Reminders for follow-ups" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-body">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="font-display text-xl font-bold text-foreground tracking-tight">
            Network<span className="text-primary">Memory</span>
          </Link>

          {/* Spacer for right-aligned buttons */}
          <div className="hidden md:block" />

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" className="rounded-full px-5" asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-6 py-4 space-y-3">
            <div className="flex gap-3 pt-2">
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" className="rounded-full" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.06),transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <motion.div initial="hidden" animate="visible" className="space-y-6">
            <motion.h1 custom={0} variants={fadeUp} className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
              Remember Every{" "}
              <span className="text-gradient">Connection</span>{" "}
              You Make.
            </motion.h1>
            <motion.p custom={1} variants={fadeUp} className="max-w-lg text-lg text-muted-foreground leading-relaxed">
              NetworkMemory helps professionals organize contacts, meeting notes, and relationships in one intelligent workspace.
            </motion.p>
            <motion.p custom={2} variants={fadeUp} className="text-sm font-medium text-primary">
              Organize. Remember. Strengthen your network.
            </motion.p>
            <motion.div custom={3} variants={fadeUp} className="space-y-3 pt-2">
              <Button size="lg" className="rounded-full gap-2 px-8 text-base" asChild>
                <Link to="/signup">
                  Sign up for free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">No credit card required.</p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex justify-center"
          >
            <img src={heroImage} alt="Professional remembering contacts illustration" className="w-full max-w-md" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="text-center"
              >
                <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About / What is NetworkMemory */}
      <section id="about" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-14 md:grid-cols-2">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="space-y-5">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                What is NetworkMemory?
              </motion.h2>
              <motion.p custom={1} variants={fadeUp} className="text-muted-foreground leading-relaxed">
                Professionals meet hundreds of people during conferences, meetings, and events. Remembering everyone and every conversation becomes difficult.
              </motion.p>
              <motion.p custom={2} variants={fadeUp} className="text-muted-foreground leading-relaxed">
                NetworkMemory allows you to store contacts, notes, and memories so you never forget an important relationship again.
              </motion.p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <img src={featureNetwork} alt="Network of connected contacts" className="w-full max-w-sm" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="mx-auto max-w-2xl text-center space-y-4 mb-14">
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Core Features
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="text-muted-foreground text-lg">
              Everything you need to build and maintain your professional network.
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
                className="group rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-xl bg-accent p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Hub / Checklist */}
      <section id="hub" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-14 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex justify-center order-2 md:order-1"
            >
              <img src={featureDashboard} alt="CRM dashboard preview" className="w-full max-w-md rounded-xl" />
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="space-y-6 order-1 md:order-2">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                Your professional relationship hub
              </motion.h2>
              <div className="space-y-3">
                {featureChecks.map((f, i) => (
                  <motion.div key={f.text} custom={i + 1} variants={fadeUp} className="flex items-center gap-3">
                    <div className="flex-shrink-0 rounded-full bg-accent p-1.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground text-sm">{f.text}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div custom={8} variants={fadeUp}>
                <Button className="rounded-full gap-2 mt-4" asChild>
                  <Link to="/signup">Get started free <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </motion.div>
            </motion.div>
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
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
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
