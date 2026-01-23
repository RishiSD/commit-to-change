"""Recipe generation from LLM knowledge."""

from typing import Annotated
from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from langchain_core.messages import SystemMessage

from .models import GeneratedRecipe


@tool
def generate_recipe_from_knowledge(
    recipe_name: str, 
    state: Annotated[dict, InjectedState]
) -> dict:
    """Generate a complete, authentic recipe from your knowledge base.
    
    IMPORTANT: Only call this tool AFTER you have:
    1. Used the frontend tool 'provide_recipe_from_knowledge' to get user approval
    2. Received APPROVED status from the user
    
    If the user CANCELS the approval, do not call this tool. Instead, politely 
    inform them they can provide a URL for recipe extraction.
    
    When generating the recipe, ensure it is:
    - Authentic and accurate for the cuisine/dish type
    - Complete with all necessary ingredients and quantities
    - Clear step-by-step instructions that are easy to follow
    - Includes helpful information (prep time, cook time, servings, difficulty)
    - Contains useful tips and notes in the Additional Information section
    
    Format Requirements:
    - Use markdown structure with clear sections
    - Start with # [Recipe Name]
    - Include ## Ingredients section with bullet points
    - Include ## Instructions section with numbered steps
    - Include ## Additional Information section with timing, tips, etc.
    
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
        - markdown (str): Complete recipe in markdown format
        - recipe_name (str): Name of the recipe
        - source ('knowledge'): Always 'knowledge' for generated recipes
        
    Example output structure:
    ```
    # Chicken Tikka Masala
    
    ## Ingredients
    
    ### For the Chicken Marinade:
    - 1 lb boneless chicken thighs, cut into bite-sized pieces
    - 1 cup plain yogurt
    - 2 tbsp lemon juice
    - ... (more ingredients)
    
    ### For the Sauce:
    - ... (more ingredients)
    
    ## Instructions
    
    1. **Marinate the chicken:** In a large bowl, combine yogurt, lemon juice...
    2. **Prepare the sauce:** Heat oil in a large pan over medium heat...
    ... (more steps)
    
    ## Additional Information
    
    - **Prep Time:** 30 minutes (plus 2 hours marinating)
    - **Cook Time:** 30 minutes
    - **Servings:** 4-6
    - **Difficulty:** Medium
    
    **Tips:**
    - For best results, marinate overnight
    - Use full-fat yogurt for creamier sauce
    - Adjust spice level to taste
    ```
    
    Note: This tool uses the LLM to generate the recipe directly from training
    knowledge. Make it comprehensive and authentic!
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
        
        generation_prompt = f"""Generate a complete, authentic recipe for {recipe_name}.

Follow these requirements:

**Format:**
- Start with # {recipe_name}
- Include ## Ingredients section with bulleted list
- Include ## Instructions section with numbered steps
- Include ## Additional Information with prep time, cook time, servings, difficulty, and tips

**Quality:**
- Use accurate measurements and realistic cooking times
- Include all necessary ingredients (don't assume common items)
- Write clear instructions for home cooks
- Add helpful tips and common mistakes to avoid
- Suggest variations where appropriate

**Authenticity:**
- Be accurate to the cuisine and cooking method
- Use traditional ingredients when appropriate
- Provide culturally authentic preparations

Generate the recipe in clean markdown format."""
        
        # For simple generation, we don't need structured output
        # The LLM will generate the markdown directly
        response = model.invoke([SystemMessage(content=generation_prompt)])
        
        markdown_content = response.content if hasattr(response, 'content') else str(response)
        
        result = GeneratedRecipe(
            markdown=markdown_content,
            recipe_name=recipe_name,
            source="knowledge"
        )
        return result.model_dump()
        
    except Exception as e:
        # Fallback error
        result = GeneratedRecipe(
            markdown=f"# {recipe_name}\n\n**Error:** Failed to generate recipe: {str(e)}",
            recipe_name=recipe_name,
            source="knowledge"
        )
        return result.model_dump()
