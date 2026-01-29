/**
 * FeatureCard component displays a feature with glassmorphism effect.
 * 
 * Features:
 * - Glassmorphism design with backdrop blur
 * - Hover glow effect with purple accent
 * - Icon, title, and description
 * - Smooth animations
 */

"use client";

import { ReactNode } from "react";

interface FeatureCardProps {
  /** Icon element (SVG or emoji) */
  icon: ReactNode;
  
  /** Feature title */
  title: string;
  
  /** Feature description */
  description: string;
  
  /** Theme color for accents */
  themeColor?: string;
}

export function FeatureCard({ 
  icon, 
  title, 
  description, 
  themeColor = "#9333ea" 
}: FeatureCardProps) {
  return (
    <div className="feature-card group relative">
      {/* Glow effect on hover */}
      <div 
        style={{ 
          background: `radial-gradient(circle at center, ${themeColor}40, transparent 70%)`
        }}
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
      />
      
      {/* Main card content with glassmorphism */}
      <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full transition-all duration-300 group-hover:border-purple-500/50 group-hover:bg-white/10">
        {/* Icon container */}
        <div 
          style={{ backgroundColor: `${themeColor}20` }}
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        >
          <div className="text-3xl" style={{ color: themeColor }}>
            {icon}
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
