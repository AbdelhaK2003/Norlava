import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const sizes = {
    sm: "w-8 h-8 text-xl",
    md: "w-10 h-10 text-2xl",
    lg: "w-16 h-16 text-4xl",
    xl: "w-24 h-24 text-6xl"
  };

  const textSize = sizes[size].split(" ")[2];

  return (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      <div className={`relative ${sizes[size].split(" ").slice(0, 2).join(" ")} transition-transform group-hover:scale-105`}>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/40 rounded-xl blur-lg group-hover:blur-xl transition-all" />

        {/* Logo Image */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src="/norlava.png"
            alt="Norlava"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {showText && (
        <span className={`font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-primary/50 to-white/50 ${textSize}`}>
          Norlava
        </span>
      )}
    </Link>
  );
};
