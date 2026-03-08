import { motion } from "framer-motion";
import { Bell, Calendar, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const floatingCards = [
  {
    name: "Revanth",
    role: "Investor",
    tag: "VIP",
    tagColor: "bg-amber-100 text-amber-700",
    initials: "RK",
    avatarBg: "bg-primary/10 text-primary",
    className: "top-4 right-8 md:top-8 md:right-12",
    delay: 0,
    duration: 8,
    y: [-4, 8, -4],
    x: [0, 6, 0],
    rotate: [0, 1.5, 0],
  },
  {
    name: "Sarah Chen",
    role: "Product Lead",
    tag: "Client",
    tagColor: "bg-blue-100 text-blue-700",
    initials: "SC",
    avatarBg: "bg-[hsl(var(--soft-purple)/0.12)] text-[hsl(var(--soft-purple))]",
    className: "bottom-24 right-4 md:bottom-32 md:right-6",
    delay: 2,
    duration: 10,
    y: [6, -6, 6],
    x: [-4, 4, -4],
    rotate: [0, -1, 0],
  },
  {
    name: "James Okafor",
    role: "Mentor",
    tag: "Mentor",
    tagColor: "bg-green-100 text-green-700",
    initials: "JO",
    avatarBg: "bg-[hsl(var(--soft-green)/0.12)] text-[hsl(var(--soft-green))]",
    className: "top-1/3 left-0 md:left-4",
    delay: 4,
    duration: 9,
    y: [-6, 4, -6],
    x: [2, -4, 2],
    rotate: [-1, 1, -1],
  },
];

const floatingBubbles = [
  {
    icon: MessageSquare,
    text: "Great meeting!",
    className: "top-2 left-1/4 md:top-6 md:left-1/3",
    delay: 1,
    duration: 7,
    y: [0, -10, 0],
  },
  {
    icon: Bell,
    text: "Follow up tomorrow",
    className: "bottom-12 left-1/4 md:bottom-16 md:left-1/4",
    delay: 3,
    duration: 11,
    y: [4, -8, 4],
  },
  {
    icon: Calendar,
    text: "Coffee chat — 3pm",
    className: "top-1/2 right-1/3 md:right-1/4",
    delay: 5,
    duration: 8,
    y: [-4, 6, -4],
  },
];

// Thin connection lines between avatars
function ConnectionLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.line
        x1="70%" y1="18%" x2="30%" y2="42%"
        stroke="hsl(228 72% 64% / 0.12)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 2, ease: "easeOut" }}
      />
      <motion.line
        x1="30%" y1="42%" x2="65%" y2="72%"
        stroke="hsl(263 70% 58% / 0.10)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 1.8, duration: 2, ease: "easeOut" }}
      />
      <motion.line
        x1="70%" y1="18%" x2="65%" y2="72%"
        stroke="hsl(142 71% 45% / 0.10)"
        strokeWidth="1.5"
        strokeDasharray="6 4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 2.4, duration: 2, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function HeroFloatingElements() {
  return (
    <div className="relative w-full h-[340px] sm:h-[400px] md:h-[440px]">
      {/* Soft glow backdrop */}
      <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,hsl(var(--soft-blue)/0.07),transparent)]" />

      <ConnectionLines />

      {/* Floating contact cards */}
      {floatingCards.map((card) => (
        <motion.div
          key={card.name}
          className={`absolute ${card.className} z-10 hidden sm:block will-change-transform`}
          style={{ transform: "translateZ(0)" }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: card.y,
            x: card.x,
            rotate: card.rotate,
          }}
          transition={{
            opacity: { delay: card.delay * 0.3, duration: 0.4 },
            scale: { delay: card.delay * 0.3, duration: 0.4 },
            y: { delay: card.delay * 0.3, duration: card.duration, repeat: Infinity, ease: "easeInOut" },
            x: { delay: card.delay * 0.3, duration: card.duration, repeat: Infinity, ease: "easeInOut" },
            rotate: { delay: card.delay * 0.3, duration: card.duration, repeat: Infinity, ease: "easeInOut" },
          }}
          whileHover={{ scale: 1.06, transition: { duration: 0.15 } }}
        >
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-md cursor-default select-none">
            <Avatar className="h-9 w-9">
              <AvatarFallback className={`${card.avatarBg} font-display text-xs font-semibold`}>
                {card.initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground leading-none">{card.name}</p>
              <p className="text-xs text-muted-foreground">{card.role}</p>
            </div>
            <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${card.tagColor}`}>
              {card.tag}
            </span>
          </div>
        </motion.div>
      ))}

      {/* Mobile: show only 2 cards */}
      {floatingCards.slice(0, 2).map((card, i) => (
        <motion.div
          key={`m-${card.name}`}
          className={`absolute sm:hidden z-10 ${i === 0 ? "top-6 right-2" : "bottom-16 left-2"}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: card.y,
          }}
          transition={{
            opacity: { delay: 0.4 + i * 0.3, duration: 0.6 },
            scale: { delay: 0.4 + i * 0.3, duration: 0.6 },
            y: { delay: 0.4 + i * 0.3, duration: card.duration, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 shadow-md">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={`${card.avatarBg} font-display text-[10px] font-semibold`}>
                {card.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-semibold text-foreground leading-none">{card.name}</p>
              <p className="text-[10px] text-muted-foreground">{card.role}</p>
            </div>
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${card.tagColor}`}>
              {card.tag}
            </span>
          </div>
        </motion.div>
      ))}

      {/* Floating message/reminder bubbles */}
      {floatingBubbles.map((bubble) => (
        <motion.div
          key={bubble.text}
          className={`absolute ${bubble.className} z-10 hidden md:flex`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: bubble.y }}
          transition={{
            opacity: { delay: bubble.delay * 0.3, duration: 0.6 },
            y: { delay: bubble.delay * 0.3, duration: bubble.duration, repeat: Infinity, ease: "easeInOut" },
          }}
          whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
        >
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/90 backdrop-blur-sm px-3 py-2 shadow-sm cursor-default select-none">
            <bubble.icon className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{bubble.text}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
