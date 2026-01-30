"use client";

import { useState, useEffect } from "react";
import { RecipeJSON } from "@/lib/types";
import { saveRecipe, isRecipeSaved } from "@/lib/supabase/savedRecipes";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "@/components/ui";
import toast from "react-hot-toast";

interface RecipeCardProps {
  recipe: RecipeJSON;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if recipe is already saved when component mounts
  useEffect(() => {
    if (recipe.source_url) {
      isRecipeSaved(recipe.source_url)
        .then(setIsSaved)
        .catch(error => {
          console.error("Error checking if recipe is saved:", error);
        });
    }
  }, [recipe.source_url]);

  // Handle save button click
  const handleSave = async () => {
    if (isSaved) {
      // Recipe is already saved, just show feedback
      toast.success("Recipe is already saved!", {
        icon: "📌",
        duration: 2000,
      });
      return;
    }

    setIsSaving(true);
    try {
      await saveRecipe({
        recipe_url: recipe.source_url || "",
        recipe_name: recipe.title,
        recipe_content: recipe,
      });
      
      setIsSaved(true);
      toast.success("Recipe saved successfully!", {
        icon: "✓",
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to save recipe:", error);
      toast.error("Failed to save recipe. Please try again.", {
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card variant="elevated" padding="lg" className="max-w-3xl">
      {/* Decorative top banner */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 rounded-t-2xl"></div>
      
      {/* Main content */}
      <div className="pt-2">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle as="h2" className="text-3xl mb-3">
                {recipe.title}
              </CardTitle>
              
              {/* Metadata badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {recipe.servings && (
                  <Badge variant="secondary" size="md">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {recipe.servings} servings
                  </Badge>
                )}
                {recipe.difficulty && (
                  <Badge 
                    variant={
                      recipe.difficulty === 'easy' ? 'success' :
                      recipe.difficulty === 'medium' ? 'warning' : 'danger'
                    }
                    size="md"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {recipe.difficulty}
                  </Badge>
                )}
                {recipe.cuisine && (
                  <Badge variant="primary" size="md">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {recipe.cuisine}
                  </Badge>
                )}
              </div>
              
              {/* Time information */}
              {(recipe.prep_time || recipe.cook_time || recipe.total_time) && (
                <div className="flex flex-wrap gap-4 text-sm text-[var(--neutral-600)]">
                  {recipe.prep_time && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-[var(--neutral-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Prep:</span> {recipe.prep_time}
                    </div>
                  )}
                  {recipe.cook_time && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-[var(--neutral-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                      <span className="font-medium">Cook:</span> {recipe.cook_time}
                    </div>
                  )}
                  {recipe.total_time && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-[var(--neutral-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Total:</span> {recipe.total_time}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Save button */}
            <Button
              variant={isSaved ? "primary" : "secondary"}
              onClick={handleSave}
              disabled={isSaving}
              isLoading={isSaving}
              title={isSaved ? "Recipe Saved" : "Save Recipe"}
              className="flex-shrink-0"
            >
              <svg 
                className="w-5 h-5" 
                fill={isSaved ? "currentColor" : "none"} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </Button>
          </div>
        </CardHeader>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {recipe.tags.map((tag, i) => (
              <Badge key={i} variant="primary" size="sm">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <CardContent>
          {/* Two column layout for larger screens */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Ingredients section */}
            <Card variant="bordered" padding="md">
              <h3 className="text-xl font-bold text-[var(--neutral-900)] mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-[var(--secondary-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Ingredients
              </h3>
              <ul className="space-y-3">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--secondary-100)] flex items-center justify-center mt-0.5 group-hover:bg-[var(--secondary-200)] transition-colors">
                      <svg className="w-3 h-3 text-[var(--secondary-600)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="flex-1 text-[var(--neutral-700)] leading-relaxed">
                      <span className="font-semibold text-[var(--neutral-900)]">
                        {typeof ing.quantity === 'number' ? ing.quantity : ing.quantity}
                        {ing.unit && ` ${ing.unit}`}
                      </span>
                      {' '}
                      {ing.name}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Instructions section */}
            <Card variant="bordered" padding="md">
              <h3 className="text-xl font-bold text-[var(--neutral-900)] mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-[var(--secondary-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Instructions
              </h3>
              <ol className="space-y-4">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-4 group">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--secondary-400)] to-[var(--secondary-500)] text-white flex items-center justify-center font-bold text-sm shadow-md group-hover:scale-110 transition-transform">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-[var(--neutral-700)] leading-relaxed pt-1">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          {/* Additional Information / Tips section */}
          {recipe.additional_info && recipe.additional_info.length > 0 && (
            <Card variant="bordered" padding="md" className="mt-8 bg-gradient-to-br from-amber-50 to-orange-50">
              <h3 className="text-xl font-bold text-[var(--neutral-900)] mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Tips & Notes
              </h3>
              <ul className="space-y-3">
                {recipe.additional_info.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center mt-0.5 group-hover:bg-amber-300 transition-colors">
                      <svg className="w-3.5 h-3.5 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="flex-1 text-[var(--neutral-700)] leading-relaxed">
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Footer with source */}
          {recipe.source_url && (
            <div className="mt-6 pt-6 border-t-2 border-[var(--neutral-200)]">
              <div className="flex items-center gap-2 text-sm text-[var(--neutral-600)]">
                <svg className="w-4 h-4 text-[var(--neutral-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-[var(--neutral-500)]">Source:</span>
                <a 
                  href={recipe.source_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[var(--primary-600)] hover:text-[var(--primary-700)] hover:underline font-medium"
                >
                  {new URL(recipe.source_url).hostname}
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </div>

      {/* Decorative bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 rounded-b-2xl"></div>
    </Card>
  );
}
