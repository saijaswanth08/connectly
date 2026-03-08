import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users, FileText, Bell, ArrowRight, Search, BarChart3, Clock, Network, Sparkles, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import dashboardPreview from "@/assets/dashboard-preview.png";
import HeroFloatingElements from "@/components/landing/HeroFloatingElements";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: Users, title: "Contact Management", description: "Store and organize professional contacts in one place." },
  { icon: FileText, title: "Meeting Notes", description: "Record notes after meetings and conversations." },
  { icon: Search, title: "Smart Search", description: "Find any contact instantly by name, company, or tags." },
  { icon: Bell, title: "Follow-Up Reminders", description: "Never forget to reconnect with important contacts." },
  { icon: Clock, title: "Relationship Timeline", description: "Track how your relationships evolve over time." },
  { icon: BarChart3, title: "Networking Insights", description: "Understand your professional connections better." },
];

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-card font-body">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="font-display text-xl font-bold text-foreground tracking-tight">
            Network<span className="text-primary">Memory</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="sm" className="rounded-full px-5" asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>

          <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-3 border-t border-border">
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
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,hsl(var(--soft-blue)/0.08),transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:py-32">
          <motion.div initial="hidden" animate="visible" className="space-y-8">
            <motion.h1 custom={0} variants={fadeUp} className="font-display text-4xl font-extrabold leading-[1.1] text-foreground sm:text-5xl lg:text-[3.5rem]">
              Remember Every{" "}
              <span className="text-gradient">Connection</span>{" "}
              You Make
            </motion.h1>
            <motion.p custom={1} variants={fadeUp} className="max-w-lg text-lg text-muted-foreground leading-relaxed">
              NetworkMemory helps professionals organize contacts, meeting notes, and relationships in one intelligent workspace.
            </motion.p>
            <motion.div custom={2} variants={fadeUp} className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" className="rounded-full gap-2 px-8 text-base shadow-md hover:shadow-lg transition-shadow" asChild>
                <Link to="/signup">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 text-base" asChild>
                <Link to="/features">Explore Features</Link>
              </Button>
            </motion.div>
          </motion.div>

          <HeroFloatingElements />
        </div>
      </section>

      {/* Product Explanation */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-14 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute -inset-4 rounded-2xl bg-[radial-gradient(ellipse_at_center,hsl(var(--soft-blue)/0.06),transparent)]" />
                <Network className="relative h-48 w-48 text-primary opacity-20" strokeWidth={0.5} />
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="space-y-5">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                Your Personal Networking CRM
              </motion.h2>
              <motion.p custom={1} variants={fadeUp} className="text-muted-foreground leading-relaxed">
                Professionals meet many people at conferences, meetings, and events. Remembering every conversation becomes difficult.
              </motion.p>
              <motion.p custom={2} variants={fadeUp} className="text-muted-foreground leading-relaxed">
                NetworkMemory helps you store contacts, notes, and relationship history in one place so you never forget an important connection.
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="mx-auto max-w-2xl text-center space-y-4 mb-16">
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need to Manage Your Professional Network
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="text-muted-foreground text-lg">
              Powerful tools designed for professionals who value their relationships.
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
                className="group rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="mb-4 inline-flex rounded-xl bg-accent p-3">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="bg-muted/40 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="mx-auto max-w-2xl text-center space-y-4 mb-14">
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              A smarter way to manage relationships
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="text-muted-foreground text-lg">
              See all your contacts, meetings, and notes in one powerful dashboard.
            </motion.p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <img
              src={dashboardPreview}
              alt="NetworkMemory CRM dashboard preview"
              className="w-full max-w-4xl rounded-2xl border border-border shadow-lg"
            />
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-3xl gradient-primary px-8 py-16 text-center space-y-6"
          >
            <motion.div custom={0} variants={fadeUp} className="inline-flex rounded-full bg-primary/10 p-3 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
            </motion.div>
            <motion.h2 custom={1} variants={fadeUp} className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Start building stronger professional relationships today
            </motion.h2>
            <motion.div custom={2} variants={fadeUp}>
              <Button size="lg" className="rounded-full gap-2 px-10 text-base shadow-md hover:shadow-lg transition-shadow" asChild>
                <Link to="/signup">
                  Create Free Account <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
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
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
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
