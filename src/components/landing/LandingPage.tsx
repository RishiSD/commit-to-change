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
              What Makes Aura Chef Special
            </h2>
            <p className="text-[var(--neutral-600)] text-lg max-w-2xl mx-auto">
              Extract recipes from any source, generate custom dishes, and get intelligent cooking assistance
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
            <FeatureCard
              icon="🔗"
              title="Recipe Extraction from Social Links"
              description="Import recipes from popular cooking sites, Instagram, YouTube, TikTok, and more. Automatically extracts ingredients, instructions, and even follows embedded links to find complete recipes."
              themeColor={THEME_COLOR}
            />
            
            <FeatureCard
              icon="✨"
              title="AI Recipe Generation"
              description="Generate complete, authentic recipes from dish names or ingredients. Get accurate measurements, cooking times, difficulty levels, and helpful tips for any cuisine."
              themeColor={THEME_COLOR}
            />
            
            <FeatureCard
              icon="🔄"
              title="Intelligent Substitutions"
              description="Chat with your AI assistant for instant ingredient swaps, dietary accommodations, and step-by-step cooking guidance tailored to your needs."
              themeColor={THEME_COLOR}
            />
            
            <FeatureCard
              icon="📚"
              title="Recipe Collection & Search"
              description="Build your personal recipe library with automatic saving. Organize, search, and filter your collection by cuisine, difficulty, or ingredients. Your recipes, always accessible."
              themeColor={THEME_COLOR}
            />
          </div>

          {/* Supported Platforms Section - Enhanced */}
          <div className="mt-20 animate-fade-in">
            <div className="text-center mb-12">
              <p className="text-[var(--neutral-600)] text-xs font-bold tracking-wider mb-3">
                EXTRACT RECIPES FROM
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-[var(--neutral-800)]">
                Works With Your Favorite Sources
              </h3>
            </div>
            
            {/* Platform Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              
              {/* Social Media Platforms */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl">
                    📱
                  </div>
                  <h4 className="text-lg font-bold text-[var(--neutral-800)]">Social Media</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-2 bg-white rounded-lg text-[var(--neutral-700)] font-medium text-sm shadow-sm">
                    Instagram
                  </span>
                  <span className="px-4 py-2 bg-white rounded-lg text-[var(--neutral-700)] font-medium text-sm shadow-sm">
                    TikTok
                  </span>
                  <span className="px-4 py-2 bg-white rounded-lg text-[var(--neutral-700)] font-medium text-sm shadow-sm">
                    YouTube
                  </span>
                  <span className="px-4 py-2 bg-white rounded-lg text-[var(--neutral-700)] font-medium text-sm shadow-sm">
                    Facebook
                  </span>
                </div>
              </div>

              {/* Recipe Websites */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white text-xl">
                    🌐
                  </div>
                  <h4 className="text-lg font-bold text-[var(--neutral-800)]">Recipe Websites</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-4 py-2 bg-white rounded-lg text-[var(--neutral-700)] font-medium text-sm shadow-sm">
                    AllRecipes
                  </span>
                  <span className="px-4 py-2 bg-white rounded-lg text-[var(--neutral-700)] font-medium text-sm shadow-sm">
                    NYT Cooking
                  </span>
                  <span className="px-4 py-2 bg-white rounded-lg text-[var(--neutral-700)] font-medium text-sm shadow-sm">
                    Food Network
                  </span>
                  <span className="px-4 py-2 bg-white rounded-lg text-[var(--neutral-700)] font-medium text-sm shadow-sm">
                    Bon Appétit
                  </span>
                  <span className="px-4 py-2 bg-white rounded-lg text-[var(--neutral-700)] font-medium text-sm shadow-sm">
                    Serious Eats
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Text */}
            <p className="text-center text-[var(--neutral-500)] text-sm mt-8">
              Plus hundreds of other recipe websites and blogs worldwide
            </p>
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
                Join us for creating amazing meals with AI assistance.
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
