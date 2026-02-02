/**
 * Recipe Detail Page - Displays full recipe information with delete functionality
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getRecipeById, deleteRecipe, SavedRecipe } from "@/lib/supabase/savedRecipes";
import { DeleteRecipeModal } from "@/components/recipe/DeleteRecipeModal";
import { Button, Badge, Card } from "@/components/ui";
import Link from "next/link";
import toast from "react-hot-toast";

export default function RecipeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;
  const { user, isLoading: authLoading } = useSupabaseAuth();
  
  const [recipe, setRecipe] = useState<SavedRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Fetch recipe on mount
  useEffect(() => {
    if (!user || !recipeId) return;

    const fetchRecipe = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getRecipeById(recipeId);
        
        if (!data) {
          setError("Recipe not found");
        } else {
          setRecipe(data);
        }
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError("Failed to load recipe. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [user, recipeId]);

  // Handle delete
  const handleDelete = async () => {
    if (!recipeId) return;

    try {
      setIsDeleting(true);
      await deleteRecipe(recipeId);
      toast.success("Recipe deleted successfully");
      router.push("/recipes");
    } catch (err) {
      console.error("Error deleting recipe:", err);
      toast.error("Failed to delete recipe. Please try again.");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--neutral-50)] flex items-center justify-center">
        <div className="text-center">
          <div 
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4"
            style={{ borderColor: 'var(--primary-500)' }}
          ></div>
          <p className="text-[var(--neutral-600)]">Loading recipe...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Show error state
  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-[var(--neutral-50)] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--error)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--neutral-800)] mb-2">{error || "Recipe not found"}</h2>
          <p className="text-[var(--neutral-600)] mb-6">
            The recipe you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Link href="/recipes">
            <Button variant="primary" size="lg">
              Back to Collection
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const recipeContent = recipe.recipe_content;

  return (
    <div className="min-h-screen bg-[var(--neutral-50)]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/recipes"
            className="inline-flex items-center text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium mb-4 transition-colors"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Collection
          </Link>
        </div>

        {/* Recipe Card */}
        <Card variant="default" padding="none">
          {/* Title Section */}
          <div className="px-8 py-6 border-b border-[var(--neutral-200)]">
            <h1 className="text-3xl font-bold text-[var(--neutral-800)] mb-4">
              {recipeContent.title}
            </h1>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {recipeContent.cuisine && (
                <Badge variant="primary" size="md">
                  {recipeContent.cuisine}
                </Badge>
              )}
              {recipeContent.difficulty && (
                <Badge
                  variant={
                    recipeContent.difficulty === "easy"
                      ? "success"
                      : recipeContent.difficulty === "medium"
                      ? "warning"
                      : "danger"
                  }
                  size="md"
                >
                  {recipeContent.difficulty}
                </Badge>
              )}
              {recipeContent.servings && (
                <Badge variant="neutral" size="md">
                  <svg
                    className="w-4 h-4 mr-1.5"
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
                  {recipeContent.servings} servings
                </Badge>
              )}
            </div>

            {/* Time Information */}
            {(recipeContent.prep_time || recipeContent.cook_time || recipeContent.total_time) && (
              <div className="flex flex-wrap gap-4 text-sm text-[var(--neutral-500)]">
                {recipeContent.prep_time && (
                  <div className="flex items-center">
                    <span className="font-medium mr-1">Prep:</span>
                    {recipeContent.prep_time}
                  </div>
                )}
                {recipeContent.cook_time && (
                  <div className="flex items-center">
                    <span className="font-medium mr-1">Cook:</span>
                    {recipeContent.cook_time}
                  </div>
                )}
                {recipeContent.total_time && (
                  <div className="flex items-center">
                    <span className="font-medium mr-1">Total:</span>
                    {recipeContent.total_time}
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {recipeContent.tags && recipeContent.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {recipeContent.tags.map((tag, index) => (
                  <Badge key={index} variant="neutral" size="sm">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="px-8 py-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Ingredients */}
              <div>
                <h2 className="text-xl font-bold text-[var(--neutral-800)] mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-[var(--primary-600)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Ingredients
                </h2>
                <ul className="space-y-2">
                  {recipeContent.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start text-[var(--neutral-600)]">
                      <span className="inline-block w-2 h-2 bg-[var(--primary-500)] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>
                        {ingredient.quantity} {ingredient.unit} {ingredient.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h2 className="text-xl font-bold text-[var(--neutral-800)] mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-[var(--primary-600)]"
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
                  Instructions
                </h2>
                <ol className="space-y-4">
                  {recipeContent.steps.map((step, index) => (
                    <li key={index} className="flex items-start text-[var(--neutral-600)]">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-[var(--primary-500)] text-white rounded-full text-sm font-bold mr-3 flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Additional Info */}
            {recipeContent.additional_info && recipeContent.additional_info.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[var(--neutral-200)]">
                <h2 className="text-xl font-bold text-[var(--neutral-800)] mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-[var(--primary-600)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Additional Information
                </h2>
                <ul className="space-y-2">
                  {recipeContent.additional_info.map((info, index) => (
                    <li key={index} className="flex items-start text-[var(--neutral-600)]">
                      <span className="inline-block w-2 h-2 bg-[var(--primary-500)] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span>{info}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source URL */}
            {recipeContent.source_url && (
              <div className="mt-6 pt-6 border-t border-[var(--neutral-200)]">
                <a
                  href={recipeContent.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium transition-colors"
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
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  View Original Recipe
                </a>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-8 py-6 bg-[var(--neutral-50)] border-t border-[var(--neutral-200)] flex justify-between items-center">
            <div className="text-sm text-[var(--neutral-600)]">
              Saved on {new Date(recipe.created_at).toLocaleDateString()}
            </div>
            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Recipe
            </Button>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteRecipeModal
        recipeName={recipeContent.title}
        isOpen={showDeleteModal}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
