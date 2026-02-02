/**
 * LandingPage component - Main landing page for Aura Chef.
 * 
 * Features:
 * - Dark elegant theme with purple glowing accents
 * - Hero section with CTA
 * - Feature cards showcasing app capabilities
 * - Login modal integration
 * - Smooth animations and transitions
 * - Fully responsive design
 */

"use client";

import { useState } from "react";
import { Header } from "./Header";
import { HeroSection } from "./HeroSection";
import { FeatureCard } from "./FeatureCard";
import { LoginModal } from "../auth/LoginModal";

const THEME_COLOR = "var(--primary-500)";

interface LandingPageProps {
  /** Optional callback when user successfully logs in */
  onLogin?: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleOpenLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLogin = () => {
    setIsLoginModalOpen(false);
  };

  return (
    <div className="landing-page relative min-h-screen bg-[var(--neutral-50)]">
      
      {/* Header */}
      <Header onSignInClick={handleOpenLogin} themeColor={THEME_COLOR} />
      {/* Hero Section */}
      <HeroSection onGetStartedClick={handleOpenLogin} themeColor={THEME_COLOR} />
      
      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--neutral-900)] mb-4">
              Powerful AI Features
            </h2>
            <p className="text-[var(--neutral-600)] text-lg max-w-2xl mx-auto">
              Everything you need to elevate your cooking experience
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
            <FeatureCard
              icon="🤖"
              title="AI-Powered Recipes"
              description="Get personalized recipe recommendations based on your preferences, dietary restrictions, and available ingredients."
              themeColor={THEME_COLOR}
            />
            
            <FeatureCard
              icon="💬"
              title="Real-time Assistance"
              description="Chat with your AI chef assistant for instant cooking tips, substitutions, and step-by-step guidance."
              themeColor={THEME_COLOR}
            />
            
            <FeatureCard
              icon="📋"
              title="Smart Meal Plans"
              description="Generate customized meal plans for the week with automatic grocery lists and nutritional insights."
              themeColor={THEME_COLOR}
            />
            
            <FeatureCard
              icon="🥕"
              title="Ingredient Management"
              description="Track your pantry, get alerts for expiring items, and discover recipes using what you have."
              themeColor={THEME_COLOR}
            />
          </div>
        </div>
      </section>
      
      {/* Additional Features or Testimonials Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 border-t border-[var(--neutral-200)]">
        <div className="container mx-auto max-w-4xl text-center">
            <div className="bg-white shadow-sm rounded-3xl p-8 sm:p-12">
              <h3 className="text-2xl sm:text-3xl font-bold text-[var(--neutral-900)] mb-4">
                Ready to transform your cooking?
              </h3>
              <p className="text-[var(--neutral-600)] text-lg mb-8">
                Join thousands of home cooks who are already creating amazing meals with AI assistance.
              </p>
            <button
              onClick={handleOpenLogin}
            style={{
                background: `linear-gradient(135deg, var(--primary-500), var(--secondary-500))`,
                boxShadow: `0 0 40px var(--primary-500)`
              }}
              className="px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative py-8 px-4 sm:px-6 lg:px-8 border-t border-[var(--neutral-200)]">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            {/* Copyright */}
            <div className="text-[var(--neutral-600)] text-sm">
              © {new Date().getFullYear()} Aura Chef. All rights reserved.
            </div>
            
            {/* Links */}
            <div className="flex items-center space-x-6 text-sm">
              <button className="text-[var(--neutral-600)] hover:text-[var(--neutral-800)] transition-colors duration-200">
                Privacy Policy
              </button>
              <button className="text-[var(--neutral-600)] hover:text-[var(--neutral-800)] transition-colors duration-200">
                Terms of Service
              </button>
              <button className="text-[var(--neutral-600)] hover:text-[var(--neutral-800)] transition-colors duration-200">
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal themeColor={THEME_COLOR} onClose={handleCloseLogin} />
      )}
    </div>
  );
}
