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

// Chat History Types
export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  thread_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ChatThread {
  id: string;
  user_id: string;
  title: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMessageInput {
  thread_id: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface CreateThreadInput {
  title?: string;
}
