/**
 * RecipeFilterPanel - Provides filtering options for the recipe collection
 * Part of Aura Chef Design System
 */

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { SavedRecipe } from "@/lib/supabase/savedRecipes";

interface RecipeFilterPanelProps {
  recipes: SavedRecipe[];
  onFilterChange: (filters: RecipeFilters) => void;
}

export interface RecipeFilters {
  searchIngredient: string;
  selectedCuisines: string[];
  selectedDifficulties: string[];
}

export function RecipeFilterPanel({ recipes, onFilterChange }: RecipeFilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<RecipeFilters>({
    searchIngredient: "",
    selectedCuisines: [],
    selectedDifficulties: [],
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Note: tag-based filtering removed

  const availableCuisines = useMemo(() => {
    const cuisines = new Set<string>();
    recipes.forEach((recipe) => {
      if (recipe.recipe_content.cuisine) {
        cuisines.add(recipe.recipe_content.cuisine);
      }
    });
    return Array.from(cuisines).sort();
  }, [recipes]);

  const difficulties = ["easy", "medium", "hard"];

  const updateFilters = (updates: Partial<RecipeFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: RecipeFilters = {
      searchIngredient: "",
      selectedCuisines: [],
      selectedDifficulties: [],
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const activeFilterCount =
    (filters.searchIngredient ? 1 : 0) +
    filters.selectedCuisines.length +
    filters.selectedDifficulties.length;

  // tag toggling removed

  const toggleCuisine = (cuisine: string) => {
    const newCuisines = filters.selectedCuisines.includes(cuisine)
      ? filters.selectedCuisines.filter((c) => c !== cuisine)
      : [...filters.selectedCuisines, cuisine];
    updateFilters({ selectedCuisines: newCuisines });
  };

  const toggleDifficulty = (difficulty: string) => {
    const newDifficulties = filters.selectedDifficulties.includes(difficulty)
      ? filters.selectedDifficulties.filter((d) => d !== difficulty)
      : [...filters.selectedDifficulties, difficulty];
    updateFilters({ selectedDifficulties: newDifficulties });
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--neutral-200)] p-4 mb-6">
      {/* Compact Filter Bar */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--neutral-400)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by title, cuisine, or ingredient..."
            value={filters.searchIngredient}
            onChange={(e) => updateFilters({ searchIngredient: e.target.value })}
            className="w-full pl-11 pr-4 py-2.5 border border-[var(--neutral-300)] rounded-xl text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-opacity-20 focus:border-[var(--primary-500)] transition-all duration-150"
          />
        </div>

        {/* Filter Dropdown Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-150 ${
              activeFilterCount > 0
                ? "bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)]"
                : "bg-[var(--neutral-100)] text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-bold bg-white text-[var(--primary-600)] rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {isExpanded && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-[var(--neutral-200)] p-4 z-10 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[var(--neutral-800)]">Filter Options</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Tags removed from UI */}

                {/* Cuisine Type */}
                {availableCuisines.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--neutral-700)] mb-2">
                      Cuisine Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableCuisines.map((cuisine) => (
                        <button
                          key={cuisine}
                          onClick={() => toggleCuisine(cuisine)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all duration-150 ${
                            filters.selectedCuisines.includes(cuisine)
                              ? "bg-[var(--primary-500)] text-white"
                              : "bg-[var(--neutral-100)] text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                          }`}
                        >
                          {cuisine}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--neutral-700)] mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {difficulties.map((difficulty) => {
                      const isSelected = filters.selectedDifficulties.includes(difficulty);
                      return (
                        <button
                          key={difficulty}
                          onClick={() => toggleDifficulty(difficulty)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-all duration-150 ${
                            isSelected
                              ? difficulty === "easy"
                                ? "bg-green-600 text-white"
                                : difficulty === "medium"
                                ? "bg-yellow-600 text-white"
                                : "bg-red-600 text-white"
                              : "bg-[var(--neutral-100)] text-[var(--neutral-700)] hover:bg-[var(--neutral-200)]"
                          }`}
                        >
                          {difficulty}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
