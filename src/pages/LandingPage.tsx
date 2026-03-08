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
      <footer className="border-t border-border bg-card py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <span className="font-display text-lg font-bold text-foreground">
                Network<span className="text-primary">Memory</span>
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your personal networking CRM for building stronger professional relationships.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-display font-semibold text-foreground text-sm">Product</h4>
              <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
                <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              </nav>
            </div>
            <div className="space-y-3">
              <h4 className="font-display font-semibold text-foreground text-sm">Support</h4>
              <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
                <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              </nav>
            </div>
            <div className="space-y-3">
              <h4 className="font-display font-semibold text-foreground text-sm">Connect</h4>
              <div className="flex gap-4">
                <a href="https://linkedin.com/company/networkmemory" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://twitter.com/networkmemory" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="https://github.com/networkmemory" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} NetworkMemory. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
