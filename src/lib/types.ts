// State of the agent, make sure this aligns with your agent's state.
export type RecipeIngredient = {
  name: string;
  quantity: number | string;
  unit: string;
};

export type RecipeJSON = {
  id: string;
  title: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
  created_at: string;
  
  // Optional metadata fields
  servings?: number;
  prep_time?: string;
  cook_time?: string;
  total_time?: string;
  difficulty?: "easy" | "medium" | "hard";
  cuisine?: string;
  source_url?: string;
  additional_info?: string[];
};

export type AgentState = {
  recipe_url?: string;
  processing_stage?: string;
  recipe_json?: RecipeJSON;
  extracted_recipe_name?: string;
};
