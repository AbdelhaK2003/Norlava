import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const sizes = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-2xl",
    xl: "w-24 h-24 text-4xl"
  };

  const textSize = sizes[size].split(" ")[2];

  return (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      {/* Mountain Symbol (Ʌ) - Simple and Clean */}
      <div className={`relative ${sizes[size].split(" ").slice(0, 2).join(" ")} flex items-center justify-center transition-transform group-hover:scale-105`}>
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGradient" x1="25" y1="75" x2="75" y2="25" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d="M 25 80 L 50 20 L 75 80"
            stroke="url(#logoGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />
        </svg>
      </div>

      {showText && (
        <span className={`font-bold tracking-tight text-white ${textSize}`}>
          Norlava
        </span>
      )}
    </Link>
  );
};
