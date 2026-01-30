/**
 * Button Component - Base button with variants
 * Part of Aura Chef Design System
 */

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-4 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)] focus-visible:ring-[var(--primary-200)] active:bg-[var(--primary-700)]",
    secondary: "bg-white text-[var(--neutral-700)] border border-[var(--neutral-300)] hover:bg-[var(--neutral-50)] hover:border-[var(--neutral-400)] focus-visible:ring-[var(--neutral-200)]",
    ghost: "bg-transparent text-[var(--primary-600)] hover:bg-[var(--primary-50)] focus-visible:ring-[var(--primary-200)]",
    danger: "bg-[var(--error)] text-white hover:bg-red-700 focus-visible:ring-red-200 active:bg-red-800",
  };
  
  const sizeStyles = {
    sm: "px-3 py-2 text-sm rounded-lg",
    md: "px-5 py-2.5 text-base rounded-xl",
    lg: "px-6 py-3 text-lg rounded-xl",
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${isLoading ? "hover:scale-100" : "hover:scale-[1.02]"} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
