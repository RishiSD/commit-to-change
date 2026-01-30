-- ============================================================================
-- Aura Chef - Recipe Save Feature Database Migration
-- ============================================================================
-- This SQL script creates the necessary database table and security policies
-- for the recipe save functionality.
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Navigate to: SQL Editor (left sidebar)
-- 4. Click "New Query"
-- 5. Copy and paste this entire script
-- 6. Click "Run" to execute
--
-- WHAT THIS DOES:
-- - Creates the user_saved_recipes table
-- - Sets up Row Level Security (RLS) policies
-- - Creates performance indexes
-- - Adds automatic timestamp update trigger
-- ============================================================================

-- Create the saved recipes table
CREATE TABLE IF NOT EXISTS public.user_saved_recipes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key to auth.users (cascade delete when user is deleted)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Recipe information
  recipe_url TEXT,  -- Nullable for AI-generated recipes without source URLs
  recipe_name TEXT NOT NULL,
  recipe_content JSONB NOT NULL,  -- Stores the complete RecipeJSON object
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent users from saving duplicate recipes from the same URL
  CONSTRAINT unique_user_recipe UNIQUE (user_id, recipe_url)
);

-- ============================================================================
-- Create indexes for better query performance
-- ============================================================================

-- Index for querying by user_id (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_user_id 
  ON public.user_saved_recipes(user_id);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_created_at 
  ON public.user_saved_recipes(created_at DESC);

-- Optional: Index for searching recipe content (uncomment if needed)
-- CREATE INDEX IF NOT EXISTS idx_user_saved_recipes_content 
--   ON public.user_saved_recipes USING GIN (recipe_content);

-- ============================================================================
-- Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.user_saved_recipes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies: Users can only access their own recipes
-- ============================================================================

-- Policy: Users can insert their own recipes
CREATE POLICY "Users can insert their own recipes"
  ON public.user_saved_recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own recipes
CREATE POLICY "Users can view their own recipes"
  ON public.user_saved_recipes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own recipes
CREATE POLICY "Users can update their own recipes"
  ON public.user_saved_recipes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own recipes
CREATE POLICY "Users can delete their own recipes"
  ON public.user_saved_recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Automatic updated_at timestamp trigger
-- ============================================================================

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to the table
CREATE TRIGGER update_user_saved_recipes_updated_at
  BEFORE UPDATE ON public.user_saved_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Verification Queries (Optional - Run these to verify setup)
-- ============================================================================

-- Check if table exists
-- SELECT EXISTS (
--   SELECT FROM information_schema.tables 
--   WHERE table_schema = 'public' 
--   AND table_name = 'user_saved_recipes'
-- );

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'user_saved_recipes';

-- Check indexes
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename = 'user_saved_recipes';

-- ============================================================================
-- Migration Complete!
-- ============================================================================
