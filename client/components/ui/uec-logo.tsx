import { cn } from "@/lib/utils";

interface UECLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
  xl: "w-12 h-12",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export function UECLogo({
  size = "md",
  className,
  showText = true,
}: UECLogoProps) {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <img
        src="https://cdn.builder.io/api/v1/image/assets%2F1b395d19798c42b290cad33382fe9140%2F274abb1d54544fee85eb21dbc2ee0ff6?format=webp&width=200"
        alt="UEC Logo"
        className={cn("object-contain", sizeClasses[size])}
      />
      <span className={cn("font-bold text-primary", textSizeClasses[size])}>
        UEC Launcher
      </span>
    </div>
  );
}

export default UECLogo;
