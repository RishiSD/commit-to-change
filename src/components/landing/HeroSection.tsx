/**
 * HeroSection component - main landing page hero with CTA.
 * 
 * Features:
 * - Large headline with gradient text effect
 * - Elegant tagline
 * - Glowing CTA button with pulse animation
 * - Floating decorative elements
 * - Smooth fade-in animations
 */

"use client";

interface HeroSectionProps {
  /** Callback when CTA button is clicked */
  onGetStartedClick: () => void;
  
  /** Theme color for accents */
  themeColor?: string;
}

export function HeroSection({ 
  onGetStartedClick, 
  themeColor = "#9333ea" 
}: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
      {/* Floating orbs background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          style={{ 
            background: `radial-gradient(circle at 20% 30%, ${themeColor}30, transparent 50%)`
          }}
          className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl animate-float-slow"
        />
        <div 
          style={{ 
            background: `radial-gradient(circle at 80% 70%, #ec489930, transparent 50%)`
          }}
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-float-slower"
        />
      </div>
      
      {/* Main content */}
      <div className="relative max-w-5xl mx-auto text-center animate-fade-in">
        {/* Badge/Tag */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-300">Powered by AI</span>
        </div>
        
        {/* Main Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span 
            style={{
              background: `linear-gradient(135deg, white, ${themeColor}, #ec4899)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
            className="block"
          >
            Your AI Culinary
          </span>
          <span className="text-white block">
            Assistant
          </span>
        </h1>
        
        {/* Tagline */}
        <p className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Transform your cooking with intelligent recipe guidance, personalized meal plans, and real-time assistance.
        </p>
        
        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onGetStartedClick}
            style={{
              background: `linear-gradient(135deg, ${themeColor}, #ec4899)`,
              boxShadow: `0 0 40px ${themeColor}60, 0 0 80px ${themeColor}30`
            }}
            className="group relative px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden"
          >
            {/* Animated gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <span className="relative flex items-center space-x-2">
              <span>Get Started</span>
              <svg 
                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 7l5 5m0 0l-5 5m5-5H6" 
                />
              </svg>
            </span>
          </button>
          
          {/* Secondary info */}
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Free to start, no credit card required</span>
          </div>
        </div>
        
        {/* Stats or social proof (optional) */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-white mb-1">10K+</div>
              <div className="text-sm text-gray-400">Recipes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">50K+</div>
              <div className="text-sm text-gray-400">Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-1">4.9/5</div>
              <div className="text-sm text-gray-400">Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
