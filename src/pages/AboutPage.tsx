import { Link } from "react-router-dom";
import { ArrowLeft, Zap, Users, Shield, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: "easeOut" as const },
  }),
};

export default function AboutPage() {
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
        <div className="mx-auto max-w-3xl px-6">
          <motion.div initial="hidden" animate="visible" className="space-y-8">
            <motion.h1 custom={0} variants={fadeUp} className="font-display text-4xl font-bold text-foreground">
              About Network<span className="text-primary">Memory</span>
            </motion.h1>

            <motion.p custom={1} variants={fadeUp} className="text-lg text-muted-foreground leading-relaxed">
              NetworkMemory is a personal networking CRM built for professionals who want to remember every connection they make. Whether you meet people at conferences, business meetings, or social events — we help you keep track of everyone.
            </motion.p>

            <motion.p custom={2} variants={fadeUp} className="text-muted-foreground leading-relaxed">
              We believe that strong relationships are the foundation of success. But keeping track of hundreds of contacts, conversations, and follow-ups is hard. That's why we built NetworkMemory — a simple, intelligent workspace to organize your professional network.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="grid gap-6 sm:grid-cols-2 pt-6">
              {[
                { icon: Zap, title: "Our Mission", desc: "To help professionals build and maintain meaningful relationships through smart contact management." },
                { icon: Users, title: "Who We Serve", desc: "Entrepreneurs, sales professionals, consultants, and anyone who values their professional network." },
                { icon: Shield, title: "Privacy First", desc: "Your data is yours. We use enterprise-grade security to keep your contacts safe and private." },
                { icon: Heart, title: "Built with Care", desc: "Every feature is designed with real users in mind — simple, useful, and delightful to use." },
              ].map((item, i) => (
                <div key={item.title} className="rounded-2xl border border-border bg-card p-6 space-y-3">
                  <div className="inline-flex rounded-xl bg-accent p-3">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
