import { motion } from "framer-motion";
import { Bell, Calendar, MessageSquare, Network } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const floatingCards = [
  {
    name: "Oliver",
    role: "Investor",
    tag: "VIP",
    tagColor: "bg-amber-100 text-amber-700",
    initials: "O",
    avatarBg: "bg-primary/10 text-primary",
    x: "75%", y: "15%",
    delay: 0,
    duration: 8,
    animY: [-4, 8, -4],
    animX: [0, 6, 0],
    rotate: [0, 1.5, 0],
  },
  {
    name: "James Okafor",
    role: "Mentor",
    tag: "Mentor",
    tagColor: "bg-green-100 text-green-700",
    initials: "JO",
    avatarBg: "bg-[hsl(var(--soft-green)/0.12)] text-[hsl(var(--soft-green))]",
    x: "25%", y: "45%",
    delay: 4,
    duration: 9,
    animY: [-6, 4, -6],
    animX: [2, -4, 2],
    rotate: [-1, 1, -1],
  },
  {
    name: "Sarah Chen",
    role: "Product Lead",
    tag: "Client",
    tagColor: "bg-blue-100 text-blue-700",
    initials: "SC",
    avatarBg: "bg-[hsl(var(--soft-purple)/0.12)] text-[hsl(var(--soft-purple))]",
    x: "65%", y: "75%",
    delay: 2,
    duration: 10,
    animY: [6, -6, 6],
    animX: [-4, 4, -4],
    rotate: [0, -1, 0],
  },
];

const floatingBubbles = [
  {
    icon: MessageSquare,
    text: "Great meeting!",
    x: "50%", y: "30%", // Midpoint of James (25,45) and Oliver (75,15)
    delay: 1,
    duration: 7,
    animY: [0, -10, 0],
  },
  {
    icon: Calendar,
    text: "Coffee chat — 3pm",
    x: "45%", y: "60%", // Midpoint of James (25,45) and Sarah (65,75)
    delay: 5,
    duration: 8,
    animY: [-4, 6, -4],
  },
  {
    icon: Bell,
    text: "Follow up tomorrow",
    x: "70%", y: "45%", // Midpoint of Oliver (75,15) and Sarah (65,75)
    delay: 3,
    duration: 11,
    animY: [4, -8, 4],
  },
];

const networkLines = [
  { x1: "25%", y1: "45%", x2: "75%", y2: "15%", color: "hsl(var(--primary)/0.15)" },
  { x1: "25%", y1: "45%", x2: "65%", y2: "75%", color: "hsl(var(--soft-purple)/0.3)" },
  { x1: "75%", y1: "15%", x2: "65%", y2: "75%", color: "hsl(var(--soft-green)/0.3)" },
];

function NetworkLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      xmlns="http://www.w3.org/2000/svg"
    >
      {networkLines.map((line, i) => (
        <motion.line
          key={`line-${i}`}
          x1={line.x1} y1={line.y1}
          x2={line.x2} y2={line.y2}
          stroke={line.color}
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 1 + i * 0.3, duration: 1.5, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}

export default function HeroFloatingElements() {
  return (
    <div className="relative w-full max-w-2xl mx-auto h-[400px] md:h-[500px] flex items-center justify-center">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)] rounded-full" />
      
      <NetworkLines />

      {/* Floating contact cards */}
      {floatingCards.map((card) => (
        <div key={card.name} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: card.x, top: card.y }}>
          <motion.div
            className="will-change-transform"
            style={{ transform: "translateZ(0)" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: card.animY,
              x: card.animX,
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
            <div className="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-border/80 bg-background px-3 sm:px-4 py-2 sm:py-3 shadow-xl shadow-black/5 cursor-default select-none">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarFallback className={`${card.avatarBg} font-display text-[10px] sm:text-xs font-semibold`}>
                  {card.initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-xs sm:text-sm font-semibold text-foreground leading-none">{card.name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{card.role}</p>
              </div>
              <span className={`ml-1.5 sm:ml-2 rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium ${card.tagColor}`}>
                {card.tag}
              </span>
            </div>
          </motion.div>
        </div>
      ))}

      {/* Floating message/reminder bubbles */}
      {floatingBubbles.map((bubble) => (
        <div key={bubble.text} className="absolute z-30 -translate-x-1/2 -translate-y-1/2" style={{ left: bubble.x, top: bubble.y }}>
          <motion.div
            className="flex will-change-transform"
            style={{ transform: "translateZ(0)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: bubble.animY }}
            transition={{
              opacity: { delay: bubble.delay * 0.3, duration: 0.4 },
              y: { delay: bubble.delay * 0.3, duration: bubble.duration, repeat: Infinity, ease: "easeInOut" },
            }}
            whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-border/60 bg-background px-2.5 sm:px-3 py-1.5 shadow-md shadow-black/5 cursor-default select-none">
              <bubble.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-foreground whitespace-nowrap">{bubble.text}</span>
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}
