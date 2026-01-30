/**
 * RecipeGridCard - Minimal recipe card for collection grid view
 * Part of Aura Chef Design System
 */

"use client";

import Link from "next/link";
import { RecipeJSON } from "@/lib/types";
import { Badge } from "@/components/ui";

interface RecipeGridCardProps {
  id: string;
  recipe: RecipeJSON;
}

export function RecipeGridCard({ id, recipe }: RecipeGridCardProps) {
  return (
    <Link href={`/recipes/${id}`}>
      <div className="group bg-white rounded-2xl border border-[var(--neutral-200)] hover:shadow-md transition-all duration-150 overflow-hidden cursor-pointer hover:-translate-y-0.5 h-full flex flex-col">
        {/* Card Content */}
        <div className="p-6 flex-grow flex flex-col">
          {/* Title */}
          <h3 className="text-lg font-bold text-[var(--neutral-800)] mb-3 line-clamp-2 group-hover:text-[var(--primary-500)] transition-colors leading-snug">
            {recipe.title}
          </h3>
          
          {/* Primary Badges Row */}
          <div className="flex flex-wrap gap-2 mb-3">
            {recipe.cuisine && (
              <Badge variant="primary" size="sm">
                {recipe.cuisine}
              </Badge>
            )}
            {recipe.difficulty && (
              <Badge 
                variant={
                  recipe.difficulty === "easy" ? "success" :
                  recipe.difficulty === "medium" ? "warning" : "danger"
                } 
                size="sm"
              >
                {recipe.difficulty}
              </Badge>
            )}
          </div>
          
          {/* Tags - Show up to 3 */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-auto">
              {recipe.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--neutral-100)] text-[var(--neutral-600)]"
                >
                  #{tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-[var(--neutral-500)]">
                  +{recipe.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Card Footer */}
        <div className="px-6 py-3 bg-[var(--neutral-50)] border-t border-[var(--neutral-100)] flex items-center justify-between text-xs text-[var(--neutral-600)]">
          {/* Quick Stats */}
          <div className="flex items-center gap-3">
            {recipe.servings && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>{recipe.servings}</span>
              </div>
            )}
            {recipe.total_time && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{recipe.total_time}</span>
              </div>
            )}
          </div>
          
          {/* View Arrow */}
          <svg
            className="w-4 h-4 text-[var(--neutral-400)] group-hover:text-[var(--primary-500)] group-hover:translate-x-1 transition-all"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
