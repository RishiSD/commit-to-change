// State of the agent, make sure this aligns with your agent's state.
export type AgentState = {
  recipe_url?: string;
  processing_stage?: string;
  recipe_content?: string;
  extracted_recipe_name?: string;
};
