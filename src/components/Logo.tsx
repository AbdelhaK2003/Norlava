import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const sizes = {
    sm: "w-10 h-10 text-xl",
    md: "w-12 h-12 text-2xl",
    lg: "w-20 h-20 text-4xl",
    xl: "w-28 h-28 text-6xl"
  };

  const textSize = sizes[size].split(" ")[2];

  return (
    <Link to="/" className={`flex items-center gap-3 group ${className}`}>
      <div className={`relative ${sizes[size].split(" ").slice(0, 2).join(" ")} transition-transform group-hover:scale-105`}>
        {/* Logo Image - no background needed for transparent PNG */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src="/logo-transparent-png.png"
            alt="Norlava"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {showText && (
        <span className={`font-bold tracking-tight text-white ${textSize}`}>
          Norlava
        </span>
      )}
    </Link>
  );
};
