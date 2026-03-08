import { Link } from "react-router-dom";
import { ArrowLeft, Instagram, MessageCircle, Linkedin, Mail, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import illustrationSupport from "@/assets/illustration-support.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const socials = [
  { icon: Instagram, label: "Instagram", link: "https://instagram.com/connectly", handle: "@connectly", color: "text-pink-500" },
  { icon: MessageCircle, label: "WhatsApp", link: "https://wa.me/1234567890", handle: "+1 234 567 890", color: "text-green-500" },
  { icon: Linkedin, label: "LinkedIn", link: "https://linkedin.com/company/connectly", handle: "Connectly", color: "text-blue-500" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

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
          <motion.div initial="hidden" animate="visible" className="space-y-4">
            <motion.h1 custom={0} variants={fadeUp} className="font-display text-4xl font-bold text-foreground sm:text-5xl">
              Contact Us
            </motion.h1>
            <motion.p custom={1} variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed">
              Have questions about Connectly? We would love to hear from you.
            </motion.p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="hidden md:flex justify-center"
          >
            <img src={illustrationSupport} alt="Customer support illustration" className="w-full max-w-xs" />
          </motion.div>
        </div>
      </section>

      {/* Contact Form + Info */}
      <section className="pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5"
            >
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-2xl font-bold text-foreground">
                Send us a message
              </motion.h2>
              <motion.div custom={1} variants={fadeUp} className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
                </div>
              </motion.div>
              <motion.div custom={2} variants={fadeUp} className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="How can we help?" value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} required />
              </motion.div>
              <motion.div custom={3} variants={fadeUp} className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Tell us more..." rows={5} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))} required />
              </motion.div>
              <motion.div custom={4} variants={fadeUp}>
                <Button type="submit" className="rounded-full gap-2 px-8">
                  <Send className="h-4 w-4" /> Send Message
                </Button>
              </motion.div>
            </motion.form>

            {/* Info sidebar */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-6">
              <motion.div custom={0} variants={fadeUp} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-display text-lg font-semibold text-foreground">Get in touch</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>support@connectly.com</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>+91 XXXXX XXXXX</span>
                </div>
              </motion.div>

              <motion.div custom={1} variants={fadeUp} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-display text-lg font-semibold text-foreground">Follow us</h3>
                {socials.map(s => (
                  <a
                    key={s.label}
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                    <span>{s.handle}</span>
                  </a>
                ))}
              </motion.div>
            </motion.div>
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
