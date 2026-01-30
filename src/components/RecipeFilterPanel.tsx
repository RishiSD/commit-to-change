/**
 * RecipeFilterPanel component provides filtering options for the recipe collection
 */

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { SavedRecipe } from "@/lib/supabase/savedRecipes";
import { Input, Button, Badge } from "@/components/ui";

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

  // Tag filtering removed

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
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Compact Filter Bar */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by ingredient..."
            value={filters.searchIngredient}
            onChange={(e) => updateFilters({ searchIngredient: e.target.value })}
          />
        </div>

        {/* Filter Dropdown Button */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant={activeFilterCount > 0 ? "primary" : "secondary"}
            onClick={() => setIsExpanded(!isExpanded)}
          >
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="neutral" size="sm" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* Dropdown Panel */}
          {isExpanded && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900">Filter Options</h3>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {/* Tags removed */}

                {/* Cuisine Type */}
                {availableCuisines.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Cuisine Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableCuisines.map((cuisine) => (
                        <button
                          key={cuisine}
                          onClick={() => toggleCuisine(cuisine)}
                          className="transition-opacity hover:opacity-80"
                        >
                          <Badge
                            variant={filters.selectedCuisines.includes(cuisine) ? "primary" : "neutral"}
                            size="sm"
                          >
                            {cuisine}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {difficulties.map((difficulty) => (
                      <button
                        key={difficulty}
                        onClick={() => toggleDifficulty(difficulty)}
                        className="transition-opacity hover:opacity-80"
                      >
                        <Badge
                          variant={
                            filters.selectedDifficulties.includes(difficulty)
                              ? difficulty === "easy"
                                ? "success"
                                : difficulty === "medium"
                                ? "warning"
                                : "danger"
                              : "neutral"
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {difficulty}
                        </Badge>
                      </button>
                    ))}
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
