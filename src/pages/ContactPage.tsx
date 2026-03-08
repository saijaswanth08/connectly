import { Link } from "react-router-dom";
import { ArrowLeft, Instagram, MessageCircle, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: "easeOut" as const },
  }),
};

const socials = [
  { icon: Instagram, label: "Instagram", link: "https://instagram.com/networkmemory", handle: "@networkmemory", color: "text-pink-500" },
  { icon: MessageCircle, label: "WhatsApp", link: "https://wa.me/1234567890", handle: "+1 234 567 890", color: "text-green-500" },
  { icon: Linkedin, label: "LinkedIn", link: "https://linkedin.com/company/networkmemory", handle: "NetworkMemory", color: "text-blue-500" },
  { icon: Mail, label: "Email", link: "mailto:support@networkmemory.com", handle: "support@networkmemory.com", color: "text-primary" },
];

export default function ContactPage() {
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
        <div className="mx-auto max-w-2xl px-6">
          <motion.div initial="hidden" animate="visible" className="space-y-6 text-center mb-14">
            <motion.h1 custom={0} variants={fadeUp} className="font-display text-4xl font-bold text-foreground">
              Contact Us
            </motion.h1>
            <motion.p custom={1} variants={fadeUp} className="text-lg text-muted-foreground">
              Have questions or feedback? Reach out to us on any of these platforms.
            </motion.p>
          </motion.div>

          <div className="grid gap-4">
            {socials.map((s, i) => (
              <motion.a
                key={s.label}
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                initial="hidden"
                animate="visible"
                custom={i + 2}
                variants={fadeUp}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent">
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{s.label}</p>
                  <p className="text-sm text-muted-foreground">{s.handle}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
