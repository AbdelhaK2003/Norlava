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
          className="w-full h-full text-white"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 25 75 L 50 25 L 75 75"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
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
