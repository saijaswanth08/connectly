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
    className: "top-[12%] right-[12%]",
    lineEndpoint: { x: "85%", y: "18%" },
    delay: 0,
    duration: 8,
    y: [-4, 8, -4],
    x: [0, 6, 0],
    rotate: [0, 1.5, 0],
  },
  {
    name: "James Okafor",
    role: "Mentor",
    tag: "Mentor",
    tagColor: "bg-green-100 text-green-700",
    initials: "JO",
    avatarBg: "bg-[hsl(var(--soft-green)/0.12)] text-[hsl(var(--soft-green))]",
    className: "bottom-[22%] left-[12%]",
    lineEndpoint: { x: "20%", y: "75%" },
    delay: 4,
    duration: 9,
    y: [-6, 4, -6],
    x: [2, -4, 2],
    rotate: [-1, 1, -1],
  },
  {
    name: "Sarah Chen",
    role: "Product Lead",
    tag: "Client",
    tagColor: "bg-blue-100 text-blue-700",
    initials: "SC",
    avatarBg: "bg-[hsl(var(--soft-purple)/0.12)] text-[hsl(var(--soft-purple))]",
    className: "bottom-[12%] right-[22%]",
    lineEndpoint: { x: "75%", y: "85%" },
    delay: 2,
    duration: 10,
    y: [6, -6, 6],
    x: [-4, 4, -4],
    rotate: [0, -1, 0],
  },
];

const floatingBubbles = [
  {
    icon: MessageSquare,
    text: "Great meeting!",
    className: "top-[25%] left-[18%]",
    delay: 1,
    duration: 7,
    y: [0, -10, 0],
  },
  {
    icon: Bell,
    text: "Follow up tomorrow",
    className: "top-[52%] left-[8%]",
    delay: 3,
    duration: 11,
    y: [4, -8, 4],
  },
  {
    icon: Calendar,
    text: "Coffee chat",
    className: "top-[45%] right-[8%]",
    delay: 5,
    duration: 8,
    y: [-4, 6, -4],
  },
];

function HubAndSpokeLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {floatingCards.map((card, i) => (
        <motion.line
          key={`line-${i}`}
          x1="50%" y1="50%"
          x2={card.lineEndpoint.x}
          y2={card.lineEndpoint.y}
          stroke="hsl(var(--primary) / 0.15)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 1 + i * 0.4, duration: 1.5, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}

export default function HeroFloatingElements() {
  return (
    <div className="relative w-full max-w-lg mx-auto h-[360px] sm:h-[400px] md:h-[440px] flex items-center justify-center">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)] rounded-full" />
      
      <HubAndSpokeLines />

      {/* Central Hub Node */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white dark:bg-slate-900 border border-primary/20 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
      >
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-75 duration-3000" />
        <Network className="w-7 h-7 sm:w-8 sm:h-8 text-primary relative z-10" />
      </motion.div>

      {/* Floating contact cards */}
      {floatingCards.map((card) => (
        <motion.div
          key={card.name}
          className={`absolute ${card.className} z-10 will-change-transform`}
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
          <div className="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-border/80 bg-background/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-3 shadow-lg shadow-black/5 cursor-default select-none">
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
      ))}

      {/* Floating message/reminder bubbles */}
      {floatingBubbles.map((bubble) => (
        <motion.div
          key={bubble.text}
          className={`absolute ${bubble.className} z-30 flex will-change-transform`}
          style={{ transform: "translateZ(0)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: bubble.y }}
          transition={{
            opacity: { delay: bubble.delay * 0.3, duration: 0.4 },
            y: { delay: bubble.delay * 0.3, duration: bubble.duration, repeat: Infinity, ease: "easeInOut" },
          }}
          whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-border/60 bg-background/95 backdrop-blur-md px-2.5 sm:px-3 py-1.5 shadow-md shadow-black/5 cursor-default select-none">
            <bubble.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0" />
            <span className="text-[10px] sm:text-xs font-medium text-foreground whitespace-nowrap">{bubble.text}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
