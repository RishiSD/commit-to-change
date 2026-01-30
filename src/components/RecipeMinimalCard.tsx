/**
 * RecipeMinimalCard component displays a minimal recipe card for the collection grid
 */

"use client";

import Link from "next/link";
import { RecipeJSON } from "@/lib/types";

interface RecipeMinimalCardProps {
  id: string;
  recipe: RecipeJSON;
}

export function RecipeMinimalCard({ id, recipe }: RecipeMinimalCardProps) {
  return (
    <Link href={`/recipes/${id}`}>
      <div className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer hover:scale-[1.02] h-full flex flex-col">
        {/* Card Header */}
        <div className="p-5 flex-grow">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {recipe.title}
          </h3>
          
          {/* Badges Row */}
          <div className="flex flex-wrap gap-2 mb-3">
            {recipe.cuisine && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {recipe.cuisine}
              </span>
            )}
            {recipe.difficulty && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  recipe.difficulty === "easy"
                    ? "bg-green-100 text-green-800"
                    : recipe.difficulty === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {recipe.difficulty}
              </span>
            )}
          </div>
          
          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {recipe.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                >
                  #{tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-500">
                  +{recipe.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Card Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
          {/* Quick Stats */}
          <div className="flex items-center space-x-3">
            {recipe.servings && (
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
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
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
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
            className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all"
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
