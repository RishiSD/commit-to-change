"""Recipe generation from LLM knowledge."""

from typing import Annotated
from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from langchain_core.messages import SystemMessage

from .models import GeneratedRecipe, RecipeDataForLLM, RecipeJSON


@tool
def generate_recipe_from_knowledge(
    recipe_name: str, 
    state: Annotated[dict, InjectedState]
) -> dict:
    """Generate a complete, authentic recipe from your knowledge base.
    
    Call this tool immediately after extracting a valid recipe name.
    DO NOT ask the user for confirmation - generate the recipe right away.
    
    When generating the recipe, ensure it is:
    - Authentic and accurate for the cuisine/dish type
    - Complete with all necessary ingredients and quantities
    - Clear step-by-step instructions that are easy to follow
    - Includes helpful information (prep time, cook time, servings, difficulty)
    - Contains useful tips and notes in the Additional Information section
    
    Quality Standards:
    - Use accurate measurements (metric and/or imperial)
    - Provide realistic cooking times and temperatures
    - Include all necessary ingredients (don't assume common pantry items)
    - Write instructions that a home cook can follow
    - Add helpful tips for success (e.g., "The dough should be slightly sticky")
    - Mention common mistakes to avoid if relevant
    - Suggest variations or substitutions where appropriate
    
    Args:
        recipe_name: The name of the recipe to generate (e.g., "Chicken Tikka Masala")
        
    Returns:
        GeneratedRecipe with:
        - success (bool): Whether generation succeeded
        - recipe_json (dict): Complete recipe as structured JSON (if success=True)
        - recipe_name (str): Name of the recipe
        - error (str): Error message if generation failed
        - source ('knowledge'): Always 'knowledge' for generated recipes
        
    Example output structure:
    {
        "success": true,
        "recipe_json": {
            "id": "uuid-here",
            "title": "Chicken Tikka Masala",
            "ingredients": [
                {"name": "Chicken thighs", "quantity": 500, "unit": "g"},
                {"name": "Yogurt", "quantity": 1, "unit": "cup"}
            ],
            "steps": [
                "Marinate the chicken in yogurt...",
                "Cook in sauce..."
            ],
            "tags": ["indian", "main-course"],
            "servings": 4,
            "prep_time": "30 minutes",
            "cook_time": "30 minutes",
            "total_time": "1 hour",
            "difficulty": "medium",
            "cuisine": "Indian",
            "additional_info": [
                "Marinate overnight for best results",
                "Use full-fat yogurt for creamier sauce"
            ]
        },
        "recipe_name": "Chicken Tikka Masala",
        "error": null,
        "source": "knowledge"
    }
    
    Note: This tool uses the LLM with structured output to generate the recipe 
    directly from training knowledge as structured JSON data.
    """
    try:
        # Import model dynamically
        from langchain.chat_models import init_chat_model
        import os
        
        openrouter_key = os.getenv("OPEN_ROUTER_API_KEY")
        if openrouter_key:
            model = init_chat_model(
                model="openai/gpt-oss-120b",
                model_provider="openai",
                api_key=openrouter_key,
                base_url="https://api.groq.com/openai/v1"
            )
        else:
            model = init_chat_model("google_genai:gemini-2.5-flash-lite")
        
        # Use structured output to generate RecipeDataForLLM
        structured_model = model.with_structured_output(RecipeDataForLLM)
        
        generation_prompt = f"""Generate a complete, authentic recipe for {recipe_name}.

Follow these requirements:

**Recipe Structure:**
- title: The name of the recipe
- ingredients: List of ingredients with name, quantity, and unit
  * Parse quantities carefully (e.g., 2 cups → quantity: 2, unit: "cups")
  * For ranges use strings (e.g., "2-3" for quantity)
  * For "to taste" → quantity: "to taste", unit: ""
- steps: Ordered list of clear, detailed cooking instructions
- tags: Descriptive tags (cuisine type, dietary info, difficulty, meal type)
- servings: Number of servings (integer)
- prep_time: Preparation time (e.g., "15 minutes")
- cook_time: Cooking time (e.g., "30 minutes")
- total_time: Total time (e.g., "45 minutes")
- difficulty: One of "easy", "medium", or "hard"
- cuisine: Cuisine type (e.g., "Italian", "Indian", "Mexican")
- additional_info: List of helpful tips including:
  * Cooking tips and techniques for best results
  * Common mistakes to avoid
  * Storage instructions
  * Possible substitutions or variations
  * Serving suggestions

**Quality Standards:**
- Use accurate measurements and realistic cooking times
- Include all necessary ingredients (don't assume common items)
- Write clear, detailed instructions for home cooks
- Provide helpful tips and avoid common pitfalls
- Suggest variations where appropriate

**Authenticity:**
- Be accurate to the cuisine and cooking method
- Use traditional ingredients when appropriate
- Provide culturally authentic preparations

Generate the recipe as structured JSON data."""
        
        # Generate structured recipe data
        recipe_data_result = structured_model.invoke([SystemMessage(content=generation_prompt)])
        
        # Ensure we have a RecipeDataForLLM instance
        if isinstance(recipe_data_result, dict):
            recipe_data = RecipeDataForLLM(**recipe_data_result)
        else:
            recipe_data = recipe_data_result
        
        # Convert RecipeDataForLLM to RecipeJSON (adds id, created_at, source_url)
        recipe_json = RecipeJSON(
            **recipe_data.model_dump(),
            source_url=None  # No URL for generated recipes
        )
        
        result = GeneratedRecipe(
            success=True,
            recipe_json=recipe_json.model_dump(),
            recipe_name=recipe_name,
            error=None,
            source="knowledge"
        )
        return result.model_dump()
        
    except Exception as e:
        # Fallback error
        result = GeneratedRecipe(
            success=False,
            recipe_json=None,
            recipe_name=recipe_name,
            error=f"Failed to generate recipe: {str(e)}",
            source="knowledge"
        )
        return result.model_dump()
