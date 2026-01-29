/**
 * LoginModal component provides authentication UI for Aura Chef.
 * 
 * Features:
 * - Email/Password sign in and sign up
 * - Google OAuth sign in
 * - Beautiful modal overlay
 * - Email verification support
 * - Error handling
 * 
 * This modal appears automatically when the user is not authenticated
 * and cannot be dismissed until successful login.
 */

"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase/client";

interface LoginModalProps {
  /** Theme color to match the app */
  themeColor?: string;
  
  /** Optional callback when modal should be closed (for dismissible modals) */
  onClose?: () => void;
}

export function LoginModal({ themeColor = "#9333ea", onClose }: LoginModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Dark gradient background matching landing page */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: "linear-gradient(to bottom, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)"
        }}
      />
      
      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Glow effect */}
        <div 
          style={{ 
            boxShadow: `0 0 80px ${themeColor}99, 0 0 150px ${themeColor}66`
          }}
          className="absolute inset-0 rounded-3xl blur-2xl opacity-50"
        />
        
        {/* Main card content */}
        <div className="relative bg-white rounded-3xl shadow-2xl p-8">
          {/* Close button (only shown if onClose is provided) */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* Header */}
          <div className="mb-8 mt-4 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Aura Chef
            </h1>
            <p className="text-gray-600">
              Sign in to start your culinary journey
            </p>
          </div>
          
          {/* Auth UI from Supabase */}
          <div className="auth-container">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: themeColor,
                      brandAccent: themeColor,
                      brandButtonText: "white",
                      defaultButtonBackground: "white",
                      defaultButtonBackgroundHover: "#f3f4f6",
                      defaultButtonBorder: "#e5e7eb",
                      defaultButtonText: "#374151",
                      dividerBackground: "#e5e7eb",
                      inputBackground: "white",
                      inputBorder: "#e5e7eb",
                      inputBorderHover: themeColor,
                      inputBorderFocus: themeColor,
                      inputText: "#1f2937",
                      inputLabelText: "#374151",
                      inputPlaceholder: "#9ca3af",
                      messageText: "#374151",
                      messageTextDanger: "#dc2626",
                      anchorTextColor: themeColor,
                      anchorTextHoverColor: themeColor,
                    },
                    space: {
                      spaceSmall: "4px",
                      spaceMedium: "8px",
                      spaceLarge: "16px",
                      labelBottomMargin: "8px",
                      anchorBottomMargin: "4px",
                      emailInputSpacing: "4px",
                      socialAuthSpacing: "4px",
                      buttonPadding: "10px 15px",
                      inputPadding: "10px 15px",
                    },
                    fontSizes: {
                      baseBodySize: "14px",
                      baseInputSize: "14px",
                      baseLabelSize: "14px",
                      baseButtonSize: "14px",
                    },
                    fonts: {
                      bodyFontFamily: "ui-sans-serif, system-ui, sans-serif",
                      buttonFontFamily: "ui-sans-serif, system-ui, sans-serif",
                      inputFontFamily: "ui-sans-serif, system-ui, sans-serif",
                      labelFontFamily: "ui-sans-serif, system-ui, sans-serif",
                    },
                    borderWidths: {
                      buttonBorderWidth: "1px",
                      inputBorderWidth: "1px",
                    },
                    radii: {
                      borderRadiusButton: "8px",
                      buttonBorderRadius: "8px",
                      inputBorderRadius: "8px",
                    },
                  },
                },
                className: {
                  anchor: "text-sm font-medium hover:underline",
                  button: "font-medium transition-colors duration-200",
                  container: "space-y-4",
                  divider: "my-4",
                  input: "transition-colors duration-200",
                  label: "font-medium",
                  loader: "animate-spin",
                  message: "text-sm mt-2",
                },
              }}
              providers={["google"]}
              redirectTo={typeof window !== "undefined" ? window.location.origin : undefined}
              onlyThirdPartyProviders={false}
              magicLink={false}
              showLinks={true}
              localization={{
                variables: {
                  sign_in: {
                    email_label: "Email address",
                    password_label: "Password",
                    email_input_placeholder: "Your email address",
                    password_input_placeholder: "Your password",
                    button_label: "Sign in",
                    loading_button_label: "Signing in ...",
                    social_provider_text: "Sign in with {{provider}}",
                    link_text: "Already have an account? Sign in",
                  },
                  sign_up: {
                    email_label: "Email address",
                    password_label: "Password",
                    email_input_placeholder: "Your email address",
                    password_input_placeholder: "Your password",
                    button_label: "Sign up",
                    loading_button_label: "Signing up ...",
                    social_provider_text: "Sign in with {{provider}}",
                    link_text: "Don't have an account? Sign up",
                    confirmation_text: "Check your email for the confirmation link",
                  },
                  forgotten_password: {
                    email_label: "Email address",
                    password_label: "Password",
                    email_input_placeholder: "Your email address",
                    button_label: "Send reset password instructions",
                    loading_button_label: "Sending reset instructions ...",
                    link_text: "Forgot your password?",
                    confirmation_text: "Check your email for the password reset link",
                  },
                },
              }}
            />
          </div>
          
          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
      
      {/* Global styles for Auth UI */}
      <style jsx global>{`
        .auth-container {
          /* Override default Supabase Auth UI styles */
        }
        
        .auth-container button {
          cursor: pointer;
        }
        
        .auth-container input:focus {
          outline: none;
          box-shadow: 0 0 0 2px ${themeColor}20;
        }
        
        /* Make Google button more prominent */
        .auth-container button[type="button"] {
          font-weight: 500;
        }
        
        /* Style for email verification message */
        .auth-container > div > div[role="alert"] {
          background-color: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 8px;
          padding: 12px;
          color: #166534;
        }
      `}</style>
    </div>
  );
}
