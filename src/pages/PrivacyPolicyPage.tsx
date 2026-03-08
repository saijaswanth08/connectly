import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Database, Eye, Lock, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const sections = [
  {
    icon: Database,
    title: "Information We Collect",
    items: ["Name and email address", "Contact details stored by users", "Meeting notes and voice recordings", "Usage data to improve our services"],
  },
  {
    icon: Eye,
    title: "How We Use Information",
    items: ["Provide and improve the NetworkMemory platform", "Deliver contact management and networking features", "Enhance user experience and personalization", "We never sell your personal data to third parties"],
  },
  {
    icon: Lock,
    title: "Data Protection",
    items: ["Industry-standard encryption for all data", "Enterprise-grade security infrastructure", "Regular security audits and monitoring", "Your contacts and notes are private and only accessible by you"],
  },
  {
    icon: Globe,
    title: "Third Party Services",
    items: ["Some integrations may involve third-party tools such as authentication providers", "We carefully vet all third-party services for security compliance", "Third-party services are governed by their own privacy policies"],
  },
  {
    icon: Users,
    title: "Your Rights",
    items: ["Access, correct, or delete your personal data at any time", "Export your contacts and meeting notes from your dashboard", "Request full account deletion by contacting support"],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background font-body">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Link>
          </Button>
          <Link to="/" className="font-display text-lg font-bold text-foreground">
            Network<span className="text-primary">Memory</span>
          </Link>
          <div className="w-20" />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.06),transparent)]" />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <motion.div initial="hidden" animate="visible" className="space-y-4">
            <motion.div custom={0} variants={fadeUp} className="mx-auto inline-flex rounded-xl bg-accent p-3">
              <Shield className="h-6 w-6 text-primary" />
            </motion.div>
            <motion.h1 custom={1} variants={fadeUp} className="font-display text-4xl font-bold text-foreground sm:text-5xl">
              Privacy Policy
            </motion.h1>
            <motion.p custom={2} variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed">
              Your privacy is important to us. NetworkMemory is designed to securely store your contact information and professional networking data. We ensure that all data is handled responsibly and securely.
            </motion.p>
            <motion.p custom={3} variants={fadeUp} className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Sections */}
      <section className="pb-20">
        <div className="mx-auto max-w-3xl px-6 space-y-6">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="rounded-2xl border border-border bg-card p-7 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-accent p-2.5">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground">{section.title}</h2>
              </div>
              <ul className="space-y-2 pl-1">
                {section.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {/* Contact */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={fadeUp}
            className="rounded-2xl border border-border bg-card p-7 shadow-sm text-center space-y-3"
          >
            <h2 className="font-display text-xl font-semibold text-foreground">Questions?</h2>
            <p className="text-sm text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:support@networkmemory.com" className="text-primary hover:underline">support@networkmemory.com</a>
            </p>
          </motion.div>
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
