/**
 * Recipe Collection Page - Displays all saved recipes with filtering
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getSavedRecipes, SavedRecipe } from "@/lib/supabase/savedRecipes";
import { RecipeGridCard } from "@/components/recipe/RecipeGridCard";
import { RecipeFilterPanel, RecipeFilters } from "@/components/recipe/RecipeFilterPanel";
import { EmptyRecipeState } from "@/components/recipe/EmptyRecipeState";
import { Button } from "@/components/ui";
import Link from "next/link";

export default function RecipesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useSupabaseAuth();
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecipeFilters>({
    searchIngredient: "",
    selectedCuisines: [],
    selectedDifficulties: [],
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch recipes on mount
  useEffect(() => {
    if (!user) return;

    const fetchRecipes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getSavedRecipes();
        setRecipes(data);
      } catch (err) {
        console.error("Error fetching recipes:", err);
        setError("Failed to load recipes. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [user]);

  // Filter recipes based on active filters
  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    // Filter by text search (title, cuisine, ingredient name)
    if (filters.searchIngredient.trim()) {
      const searchTerm = filters.searchIngredient.toLowerCase();

      const matches = (value?: string) =>
        !!value && value.toLowerCase().includes(searchTerm);

      filtered = filtered.filter((recipe) => {
        const content = recipe.recipe_content;

        // Check recipe content title, saved recipe name, cuisine
        if (matches(content?.title) || matches(recipe.recipe_name) || matches(content?.cuisine)) {
          return true;
        }

        // Check ingredient names (partial, case-insensitive)
        if (
          content?.ingredients?.some((ingredient) =>
            matches(ingredient?.name)
          )
        ) {
          return true;
        }

        return false;
      });
    }



    // Filter by cuisine
    if (filters.selectedCuisines.length > 0) {
      filtered = filtered.filter((recipe) =>
        recipe.recipe_content.cuisine &&
        filters.selectedCuisines.includes(recipe.recipe_content.cuisine)
      );
    }

    // Filter by difficulty
    if (filters.selectedDifficulties.length > 0) {
      filtered = filtered.filter((recipe) =>
        recipe.recipe_content.difficulty &&
        filters.selectedDifficulties.includes(recipe.recipe_content.difficulty)
      );
    }

    return filtered;
  }, [recipes, filters]);

  // Show loading state
  if (authLoading || (isLoading && !error)) {
    return (
      <div className="min-h-screen bg-[var(--neutral-50)] flex items-center justify-center">
        <div className="text-center">
          <div 
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4"
            style={{ borderColor: 'var(--primary-500)' }}
          ></div>
          <p className="text-[var(--neutral-600)]">Loading your recipes...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--neutral-50)]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="text-[var(--neutral-500)] hover:text-[var(--neutral-800)] transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-[var(--neutral-800)]">My Recipe Collection</h1>
            </div>
            <div className="text-sm text-[var(--neutral-600)]">
              {filteredRecipes.length === recipes.length ? (
                <span>
                  {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
                </span>
              ) : (
                <span>
                  {filteredRecipes.length} of {recipes.length} recipes
                </span>
              )}
            </div>
          </div>
          <p className="text-[var(--neutral-600)]">
            Browse and manage your saved recipes
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        {recipes.length === 0 ? (
          <EmptyRecipeState />
        ) : (
          <>
            {/* Filter Panel */}
            <RecipeFilterPanel recipes={recipes} onFilterChange={setFilters} />

            {/* Recipes Grid */}
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[var(--neutral-800)] mb-2">
                  No recipes match your filters
                </h3>
                <p className="text-[var(--neutral-600)] mb-4">
                  Try adjusting your filter criteria to see more results
                </p>
                <Button
                  variant="primary"
                  onClick={() =>
                  setFilters({
                      searchIngredient: "",
                      selectedCuisines: [],
                      selectedDifficulties: [],
                    })
                  }
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRecipes.map((recipe) => (
                  <RecipeGridCard
                    key={recipe.id}
                    id={recipe.id}
                    recipe={recipe.recipe_content}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
