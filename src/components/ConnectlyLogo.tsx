export function ConnectlyLogoIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="connectly-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5B7CFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      {/* Left node */}
      <circle cx="8" cy="10" r="5" fill="url(#connectly-grad)" />
      {/* Right node */}
      <circle cx="32" cy="10" r="5" fill="url(#connectly-grad)" />
      {/* Bottom node */}
      <circle cx="20" cy="32" r="5.5" fill="url(#connectly-grad)" />
      {/* V-shaped connection lines */}
      <line x1="8" y1="14" x2="20" y2="28" stroke="url(#connectly-grad)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="14" x2="20" y2="28" stroke="url(#connectly-grad)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
