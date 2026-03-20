import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

// Animated network visualization inspired by professional networking imagery
const nodes = [
  { x: 50, y: 50, size: 18, delay: 0, isPerson: true },    // Center
  { x: 20, y: 25, size: 10, delay: 0.3, isPerson: true },
  { x: 80, y: 20, size: 10, delay: 0.5, isPerson: true },
  { x: 15, y: 70, size: 9, delay: 0.7, isPerson: true },
  { x: 82, y: 75, size: 10, delay: 0.4, isPerson: true },
  { x: 38, y: 15, size: 7, delay: 0.9, isPerson: false },
  { x: 65, y: 85, size: 7, delay: 1.1, isPerson: false },
  { x: 90, y: 45, size: 8, delay: 0.6, isPerson: false },
  { x: 8, y: 45, size: 7, delay: 0.8, isPerson: false },
  { x: 55, y: 20, size: 6, delay: 1.0, isPerson: false },
  { x: 35, y: 80, size: 6, delay: 1.2, isPerson: false },
  { x: 70, y: 50, size: 8, delay: 0.5, isPerson: true },
];

const connections = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 7], [0, 11],
  [1, 5], [1, 8], [2, 9], [2, 7],
  [3, 8], [3, 10], [4, 6], [4, 11],
  [5, 9], [6, 10], [7, 11],
];

function PersonIcon({ x, y, size }: { x: number; y: number; size: number }) {
  const s = size * 0.5;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle cx="0" cy={-s * 0.4} r={s * 0.35} fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d={`M${-s * 0.5},${s * 0.5} Q${-s * 0.5},${-s * 0.05} 0,${-s * 0.05} Q${s * 0.5},${-s * 0.05} ${s * 0.5},${s * 0.5}`} fill="none" stroke="currentColor" strokeWidth="1.2" />
    </g>
  );
}

export default function NetworkGraphAnimated() {
  return (
    <div className="relative w-full aspect-square max-w-[320px] mx-auto">
      {/* Outer ring glow */}
      <motion.div
        className="absolute inset-4 rounded-full border border-primary/10"
        animate={{ scale: [1, 1.03, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-8 rounded-full border border-primary/5"
        animate={{ scale: [1, 1.02, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <svg
        viewBox="0 0 100 100"
        className="relative w-full h-full text-primary"
      >
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--soft-blue))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--soft-blue))" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--soft-blue))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--soft-purple))" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Connection lines with pulse animation */}
        {connections.map(([a, b], i) => {
          const nodeA = nodes[a];
          const nodeB = nodes[b];
          if (!nodeA || !nodeB) return null;
          return (
            <motion.line
              key={`conn-${i}`}
              x1={`${nodeA.x ?? 0}`}
              y1={`${nodeA.y ?? 0}`}
              x2={`${nodeB.x ?? 0}`}
              y2={`${nodeB.y ?? 0}`}
              stroke="url(#lineGrad)"
              strokeWidth="0.4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0.2, 0.5, 0.2] }}
              transition={{
                pathLength: { delay: 0.5 + i * 0.1, duration: 1.5, ease: "easeOut" },
                opacity: { delay: 2, duration: 3 + (i % 3), repeat: Infinity, ease: "easeInOut" },
              }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g
            key={`node-${i}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: node.delay, duration: 0.5, ease: "backOut" }}
          >
            {/* Glow circle */}
            <motion.circle
              cx={node.x ?? 0}
              cy={node.y ?? 0}
              r={(node.size ?? 6) * 0.8}
              fill="url(#nodeGlow)"
              animate={{
                r: [(node.size ?? 6) * 0.7, (node.size ?? 6) * 1.0, (node.size ?? 6) * 0.7],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Core dot */}
            <motion.circle
              cx={node.x ?? 0}
              cy={node.y ?? 0}
              r={(node.size ?? 6) * 0.25}
              fill="hsl(var(--soft-blue))"
              className="text-primary"
              animate={{
                r: [(node.size ?? 6) * 0.22, (node.size ?? 6) * 0.28, (node.size ?? 6) * 0.22],
              }}
              transition={{ duration: 2 + i * 0.2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Person icon for key nodes */}
            {node.isPerson && (
              <motion.g
                animate={{ y: [0, -0.5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: node.delay }}
              >
                <PersonIcon x={node.x ?? 0} y={(node.y ?? 0) - (node.size ?? 6) * 0.6} size={node.size ?? 6} />
              </motion.g>
            )}
          </motion.g>
        ))}


      </svg>
    </div>
  );
}
