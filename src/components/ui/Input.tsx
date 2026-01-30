/**
 * Input Component - Text input with variants
 * Part of Aura Chef Design System
 */

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, helperText, className = "", ...props }, ref) => {
    const baseStyles = "w-full px-4 py-2.5 text-base font-normal border rounded-lg transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2";
    
    const stateStyles = error
      ? "border-[var(--error)] focus-visible:ring-red-200 focus-visible:border-[var(--error)]"
      : "border-[var(--neutral-300)] focus-visible:ring-[var(--primary-500)] focus-visible:ring-opacity-20 focus-visible:border-[var(--primary-500)]";
    
    const textStyles = "text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)]";
    
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`${baseStyles} ${stateStyles} ${textStyles} ${className}`}
          {...props}
        />
        {helperText && (
          <p className={`mt-1.5 text-sm ${error ? "text-[var(--error)]" : "text-[var(--neutral-500)]"}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
