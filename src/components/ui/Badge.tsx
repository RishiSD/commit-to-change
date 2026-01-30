/**
 * Badge Component - Small label for metadata, tags, and status
 * Part of Aura Chef Design System
 */

import { ReactNode } from "react";

interface BadgeProps {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = "neutral",
  size = "md",
  children,
  className = "",
}: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium";
  
  const variantStyles = {
    primary: "bg-[var(--primary-100)] text-[var(--primary-800)]",
    secondary: "bg-[var(--secondary-100)] text-[var(--secondary-800)]",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    neutral: "bg-[var(--neutral-100)] text-[var(--neutral-700)]",
  };
  
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs rounded-full",
    md: "px-2.5 py-1 text-sm rounded-full",
  };
  
  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}
