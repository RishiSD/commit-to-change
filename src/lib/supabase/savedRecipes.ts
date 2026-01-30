/**
 * Supabase Saved Recipes Service
 * 
 * This module provides functions for managing user saved recipes in Supabase.
 * All operations respect Row Level Security (RLS) policies - users can only
 * access their own saved recipes.
 * 
 * Database Table: user_saved_recipes
 * - id: UUID (primary key)
 * - user_id: UUID (foreign key to auth.users)
 * - recipe_url: TEXT (unique with user_id)
 * - recipe_name: TEXT
 * - recipe_content: JSONB (flexible storage for recipe data)
 * - created_at: TIMESTAMP
 * - updated_at: TIMESTAMP
 */

import { supabase } from "@/lib/supabase/client";
import { RecipeJSON } from "@/lib/types";

// Types
export interface SavedRecipe {
  id: string;
  user_id: string;
  recipe_url: string;
  recipe_name: string;
  recipe_content: RecipeJSON; // Use RecipeJSON type instead of any
  created_at: string;
  updated_at: string;
}

export interface SaveRecipeInput {
  recipe_url: string;
  recipe_name: string;
  recipe_content: RecipeJSON; // Use RecipeJSON type instead of any
}

/**
 * Save a recipe for the current user
 * 
 * @param input - Recipe data to save
 * @returns Promise<SavedRecipe> - The saved recipe record
 * @throws Error if save fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const savedRecipe = await saveRecipe({
 *   recipe_url: "https://example.com/recipe/123",
 *   recipe_name: "Chocolate Chip Cookies",
 *   recipe_content: { ingredients: [...], steps: [...] }
 * });
 * ```
 */
export async function saveRecipe(input: SaveRecipeInput): Promise<SavedRecipe> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }
  
  const user = session.user;

  // Insert recipe (upsert to handle duplicates based on recipe_url)
  const { data, error } = await supabase
    .from('user_saved_recipes')
    .upsert({
      user_id: user.id,
      recipe_url: input.recipe_url || null,
      recipe_name: input.recipe_name,
      recipe_content: input.recipe_content,
    }, {
      onConflict: 'user_id,recipe_url',
      ignoreDuplicates: false, // Update if exists
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving recipe:", error);
    throw new Error(`Failed to save recipe: ${error.message}`);
  }

  return data;
}

/**
 * Get a single saved recipe by ID
 * 
 * @param recipeId - UUID of the recipe to fetch
 * @returns Promise<SavedRecipe | null> - The recipe record or null if not found
 * @throws Error if fetch fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const recipe = await getRecipeById("123e4567-e89b-12d3-a456-426614174000");
 * if (recipe) {
 *   console.log(`Found recipe: ${recipe.recipe_name}`);
 * }
 * ```
 */
export async function getRecipeById(recipeId: string): Promise<SavedRecipe | null> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }

  // Fetch the recipe (RLS ensures user can only access their own)
  const { data, error } = await supabase
    .from('user_saved_recipes')
    .select('*')
    .eq('id', recipeId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching recipe:", error);
    throw new Error(`Failed to fetch recipe: ${error.message}`);
  }

  return data;
}

/**
 * Get all saved recipes for the current user
 * 
 * @returns Promise<SavedRecipe[]> - Array of saved recipes
 * @throws Error if fetch fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const recipes = await getSavedRecipes();
 * console.log(`You have ${recipes.length} saved recipes`);
 * ```
 */
export async function getSavedRecipes(): Promise<SavedRecipe[]> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }

  // Fetch all recipes for the user, sorted by most recent first
  const { data, error } = await supabase
    .from('user_saved_recipes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching saved recipes:", error);
    throw new Error(`Failed to fetch saved recipes: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a saved recipe by ID
 * 
 * @param recipeId - UUID of the recipe to delete
 * @returns Promise<void>
 * @throws Error if delete fails, user is not authenticated, or recipe not found
 * 
 * @example
 * ```typescript
 * await deleteRecipe("123e4567-e89b-12d3-a456-426614174000");
 * ```
 */
export async function deleteRecipe(recipeId: string): Promise<void> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }

  // Delete the recipe (RLS ensures user can only delete their own)
  const { error } = await supabase
    .from('user_saved_recipes')
    .delete()
    .eq('id', recipeId);

  if (error) {
    console.error("Error deleting recipe:", error);
    throw new Error(`Failed to delete recipe: ${error.message}`);
  }
}

/**
 * Check if a recipe URL is already saved by the current user
 * 
 * @param recipeUrl - URL to check
 * @returns Promise<boolean> - true if recipe is saved, false otherwise
 * @throws Error if check fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const isSaved = await isRecipeSaved("https://example.com/recipe/123");
 * if (isSaved) {
 *   console.log("Recipe is already in your collection");
 * }
 * ```
 */
export async function isRecipeSaved(recipeUrl: string): Promise<boolean> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    return false; // Not authenticated = not saved
  }

  // Check if recipe exists
  const { data, error } = await supabase
    .from('user_saved_recipes')
    .select('id')
    .eq('recipe_url', recipeUrl)
    .maybeSingle();

  if (error) {
    console.error("Error checking if recipe is saved:", error);
    return false;
  }

  return !!data;
}

/**
 * Update a saved recipe's content
 * 
 * @param recipeId - UUID of the recipe to update
 * @param updates - Partial recipe data to update
 * @returns Promise<SavedRecipe> - The updated recipe record
 * @throws Error if update fails, user is not authenticated, or recipe not found
 * 
 * @example
 * ```typescript
 * const updated = await updateRecipe("123e4567-e89b-12d3-a456-426614174000", {
 *   recipe_name: "Best Chocolate Chip Cookies Ever",
 *   recipe_content: { ...newContent }
 * });
 * ```
 */
export async function updateRecipe(
  recipeId: string,
  updates: Partial<Omit<SaveRecipeInput, "recipe_url">>
): Promise<SavedRecipe> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }

  // Update the recipe (RLS ensures user can only update their own)
  const { data, error } = await supabase
    .from('user_saved_recipes')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recipeId)
    .select()
    .single();

  if (error) {
    console.error("Error updating recipe:", error);
    throw new Error(`Failed to update recipe: ${error.message}`);
  }

  return data;
}
