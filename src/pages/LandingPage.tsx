import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users, FileText, Bell, ArrowRight, Search, BarChart3, Clock, Sparkles, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import dashboardPreview from "@/assets/dashboard-preview.png";
import HeroFloatingElements from "@/components/landing/HeroFloatingElements";
import NetworkGraphAnimated from "@/components/landing/NetworkGraphAnimated";
import { ConnectlyLogoIcon } from "@/components/ConnectlyLogo";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
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

const navLinks: { label: string; href: string }[] = [];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-card font-body">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="transition-transform duration-200 group-hover:scale-105">
              <ConnectlyLogoIcon size={34} />
            </div>
            <span className="hidden sm:inline text-[22px] font-extrabold tracking-tight bg-gradient-to-r from-[#5B7CFA] to-[#8B5CF6] bg-clip-text text-transparent transition-opacity duration-200 group-hover:opacity-80">
              Connectly
            </span>
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
              Connectly helps professionals organize contacts, meeting notes, and relationships in one intelligent workspace.
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
              <NetworkGraphAnimated />
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} className="space-y-5">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                Your Personal Networking CRM
              </motion.h2>
              <motion.p custom={1} variants={fadeUp} className="text-muted-foreground leading-relaxed">
                Professionals meet many people at conferences, meetings, and events. Remembering every conversation becomes difficult.
              </motion.p>
              <motion.p custom={2} variants={fadeUp} className="text-muted-foreground leading-relaxed">
                Connectly helps you store contacts, notes, and relationship history in one place so you never forget an important connection.
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
                className="group rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow duration-150 hover:shadow-md"
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
              alt="Connectly CRM dashboard preview"
              loading="lazy"
              decoding="async"
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
      <footer className="bg-muted/60 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {/* Brand */}
            <div className="space-y-4">
              <span className="font-display text-lg font-bold text-foreground">
                Connect<span className="text-primary">ly</span>
              </span>
              <p className="font-display text-sm font-medium text-foreground">
                Build stronger professional relationships.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Connectly helps professionals organize contacts, meeting notes, and relationships in one simple workspace.
              </p>
            </div>

            {/* Platform */}
            <div className="space-y-4">
              <h4 className="font-display font-semibold text-foreground text-sm">Company</h4>
              <nav className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                {[
                  { label: "About", to: "/about" },
                  { label: "Privacy Policy", to: "/privacy-policy" },
                  { label: "Contact Us", to: "/contact" },
                ].map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="hover:text-primary transition-colors w-fit relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Connect */}
            <div className="space-y-4">
              <h4 className="font-display font-semibold text-foreground text-sm">Connect</h4>
              <div className="flex gap-4">
                {[
                  {
                    label: "WhatsApp Business",
                    href: "https://wa.me/918332925147",
                    icon: (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Instagram",
                    href: "https://instagram.com",
                    icon: (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    ),
                  },
                  {
                    label: "LinkedIn",
                    href: "https://linkedin.com",
                    icon: (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Gmail",
                    href: "https://mail.google.com/mail/?view=cm&fs=1&to=connectly.support@gmail.com",
                    icon: (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                      </svg>
                    ),
                  },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Connectly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
