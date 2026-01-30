/**
 * EmptyRecipeState - Displays when user has no saved recipes
 * Part of Aura Chef Design System
 */

"use client";

import Link from "next/link";
import { Button } from "@/components/ui";

export function EmptyRecipeState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div 
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'var(--primary-100)' }}
          >
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--primary-600)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>
        
        {/* Heading */}
        <h2 className="text-2xl font-bold text-[var(--neutral-800)] mb-3">
          No Recipes Yet
        </h2>
        
        {/* Description */}
        <p className="text-[var(--neutral-600)] mb-8 leading-relaxed">
          Start building your recipe collection by extracting recipes from URLs or generating them with AI in the chat interface.
        </p>
        
        {/* CTA Button */}
        <Link href="/">
          <Button size="lg">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            Go to Chat
          </Button>
        </Link>
      </div>
    </div>
  );
}
