/**
 * Header component for the landing page.
 * 
 * Features:
 * - Fixed position at top with backdrop blur
 * - Logo/Brand name on left
 * - Sign In button on right
 * - Elegant design with dark theme
 */

"use client";

import { Button } from "@/components/ui";

interface HeaderProps {
  /** Callback when sign in button is clicked */
  onSignInClick: () => void;
  
  /** Theme color for accents */
  themeColor?: string;
}

export function Header({ onSignInClick, themeColor = "#9333ea" }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-black/20 backdrop-blur-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div 
              style={{ 
                background: `linear-gradient(135deg, ${themeColor}, #ec4899)`,
                boxShadow: `0 0 20px ${themeColor}60`
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
            >
              <span className="text-2xl">👨‍🍳</span>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Aura Chef
              </h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                AI Culinary Assistant
              </p>
            </div>
          </div>
          
          {/* Sign In Button */}
          <Button
            variant="primary"
            onClick={onSignInClick}
            style={{
              background: `linear-gradient(135deg, ${themeColor}, #ec4899)`,
              boxShadow: `0 0 20px ${themeColor}40`
            }}
            className="hover:scale-105 hover:shadow-lg transition-all duration-300"
          >
            Sign In
          </Button>
        </div>
      </div>
    </header>
  );
}
