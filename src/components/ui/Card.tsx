/**
 * Card Component - Container for content
 * Part of Aura Chef Design System
 */

import { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered";
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

export function Card({
  variant = "default",
  padding = "md",
  children,
  className = "",
  ...props
}: CardProps) {
  const baseStyles = "bg-white rounded-2xl";
  
  const variantStyles = {
    default: "border border-[var(--neutral-200)]",
    elevated: "shadow-sm hover:shadow-md transition-shadow duration-150",
    bordered: "border-2 border-[var(--neutral-200)]",
  };
  
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };
  
  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ children, className = "", ...props }: CardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4";
}

export function CardTitle({ 
  children, 
  as: Tag = "h3", 
  className = "", 
  ...props 
}: CardTitleProps) {
  return (
    <Tag 
      className={`text-xl font-bold text-[var(--neutral-800)] ${className}`} 
      {...props}
    >
      {children}
    </Tag>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ children, className = "", ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ children, className = "", ...props }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-[var(--neutral-200)] ${className}`} {...props}>
      {children}
    </div>
  );
}
