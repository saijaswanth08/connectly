import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: "easeOut" as const },
  }),
};

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </motion.h1>

            <motion.p custom={1} variants={fadeUp} className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </motion.p>

            {[
              { title: "1. Information We Collect", content: "We collect information you provide directly, such as your name, email address, and contact data you store in NetworkMemory. We also collect usage data to improve our services." },
              { title: "2. How We Use Your Information", content: "Your data is used solely to provide and improve the NetworkMemory service. We never sell your personal information to third parties. Your contacts and notes are private and only accessible by you." },
              { title: "3. Data Security", content: "We use industry-standard encryption and security measures to protect your data. All data is stored securely with enterprise-grade infrastructure and regular security audits." },
              { title: "4. Data Retention", content: "Your data is retained as long as your account is active. You can request deletion of your account and all associated data at any time by contacting our support team." },
              { title: "5. Cookies", content: "We use essential cookies to maintain your session and remember your preferences. We do not use tracking cookies for advertising purposes." },
              { title: "6. Your Rights", content: "You have the right to access, correct, or delete your personal data. You can export your contacts and meeting notes at any time from your dashboard." },
              { title: "7. Contact Us", content: "If you have any questions about this Privacy Policy, please contact us at support@networkmemory.com or through our Contact page." },
            ].map((section, i) => (
              <motion.div key={section.title} custom={i + 2} variants={fadeUp} className="space-y-2">
                <h2 className="font-display text-xl font-semibold text-foreground">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
