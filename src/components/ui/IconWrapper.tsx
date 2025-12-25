import { type LucideIcon } from "lucide-react";

interface IconWrapperProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  strokeWidth?: number;
  onClick?: () => void;
}

export function IconWrapper({
  icon: Icon,
  size = 24,
  className = "",
  strokeWidth = 2,
  onClick,
}: IconWrapperProps) {
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center justify-center flex-shrink-0 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      aria-hidden="true"
    >
      <Icon size={size} strokeWidth={strokeWidth} />
    </span>
  );
}
