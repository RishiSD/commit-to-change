"""Recipe validation and name extraction tools."""

from typing import Annotated
from langchain_core.tools import tool
from langgraph.prebuilt import InjectedState
from langchain_core.messages import SystemMessage

from .models import ValidationResult, RecipeNameExtraction


@tool
def validate_recipe_content(content: str, state: Annotated[dict, InjectedState]) -> dict:
    """Validate if extracted content contains a complete, valid recipe.
    
    A valid recipe MUST have BOTH of these components:
    1. A list of ingredients with quantities (e.g., "2 cups flour", "1 tsp salt")
    2. Step-by-step cooking/preparation instructions
    
    This tool also attempts to extract the recipe name from the content and 
    stores it in state for later use.
    
    Use this tool after extract_url_content or follow_recipe_link to determine
    if the extracted content is actually a recipe or just food-related content.
    
    Validation Criteria:
    - MUST have a clear ingredients section with quantities and measurements
    - MUST have step-by-step cooking instructions or preparation method
    - Should have a recipe name/title (extract if present)
    - Be strict: reject content that is only reviews, menus, nutrition articles,
      equipment guides, or incomplete recipe fragments
    
    Args:
        content: The text content to validate
        
    Returns:
        ValidationResult with:
        - is_valid_recipe (bool): True if content contains a complete recipe
        - recipe_name (str | None): Extracted recipe name if found
        - has_ingredients (bool): Whether ingredients list was found
        - has_instructions (bool): Whether cooking instructions were found
        - reason (str): Explanation of validation result
        - confidence (float): Confidence score 0.0-1.0
        
    IMPORTANT: Be strict. Reject content that is:
    - Restaurant reviews or menus
    - Nutrition articles without recipes
    - Cooking equipment guides
    - Food photography without instructions
    - Ingredient lists without cooking steps
    - Cooking steps without ingredient lists
    
    The recipe name is automatically stored in state if found.
    """
    # Import model dynamically to avoid circular imports
    # In actual node usage, we'll get the model from agent_v3
    try:
        # This is a placeholder - in nodes.py, we'll use the model from agent_v3
        from langchain.chat_models import init_chat_model
        import os
        
        # Use same model initialization logic as agent_v3
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
        
        structured_model = model.with_structured_output(ValidationResult)
        
        validation_prompt = f"""Validate the following content to determine if it contains a complete, valid recipe.

CONTENT TO VALIDATE:
{content[:3000]}  # Truncate to avoid token limits

VALIDATION REQUIREMENTS:
1. Check for a clear ingredients section with quantities (e.g., "2 cups flour", "1 tsp salt")
2. Check for step-by-step cooking/preparation instructions
3. Extract the recipe name/title if present (usually at the beginning)
4. Be STRICT - reject restaurant reviews, menus, nutrition articles, equipment guides, or incomplete content

A recipe is only valid if it has BOTH ingredients AND instructions.

Provide your assessment as a ValidationResult with:
- is_valid_recipe: true only if BOTH ingredients AND instructions are present
- recipe_name: extracted recipe name or null
- has_ingredients: whether ingredient list exists
- has_instructions: whether cooking instructions exist  
- reason: clear explanation of validation decision
- confidence: score from 0.0 to 1.0 indicating confidence in assessment"""
        
        result = structured_model.invoke([SystemMessage(content=validation_prompt)])
        
        # Store recipe name in state if found
        if result.recipe_name:
            state["extracted_recipe_name"] = result.recipe_name
        
        return result.model_dump()
        
    except Exception as e:
        # Fallback to manual validation if LLM fails
        result = ValidationResult(
            is_valid_recipe=False,
            recipe_name=None,
            has_ingredients=False,
            has_instructions=False,
            reason=f"Validation failed: {str(e)}",
            confidence=0.0
        )
        return result.model_dump()


@tool
def extract_recipe_name(text: str) -> dict:
    """Extract recipe name from user request or content.
    
    Use this tool when the user asks for a specific recipe by name without 
    providing a URL. This helps identify what recipe they want to generate.
    
    Examples of extraction patterns:
    - "I want chicken tikka masala" → "Chicken Tikka Masala"
    - "give me a pasta carbonara recipe" → "Pasta Carbonara"
    - "how do I make chocolate chip cookies" → "Chocolate Chip Cookies"
    - "show me the recipe for beef wellington" → "Beef Wellington"
    - "looking for a good lasagna" → "Lasagna"
    - "can you make pad thai" → "Pad Thai"
    
    Args:
        text: User's message or content containing recipe name
        
    Returns:
        RecipeNameExtraction with:
        - recipe_name (str | None): Extracted and title-cased recipe name
        - confidence ('high' | 'medium' | 'low'): Extraction confidence level
        - reason (str): Explanation of extraction decision
        
    Extraction Guidelines:
    - Look for food dish names after common recipe request phrases
    - Remove filler words like "recipe", "please", "thanks"
    - Title case the extracted name (e.g., "Chicken Tikka Masala")
    - High confidence: clear recipe request pattern
    - Medium confidence: food name present but less clear
    - Low confidence: cannot identify recipe name
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
        
        structured_model = model.with_structured_output(RecipeNameExtraction)
        
        extraction_prompt = f"""Extract the recipe name from the following user text.

USER TEXT:
{text}

EXTRACTION GUIDELINES:
1. Identify the food dish or recipe name the user is requesting
2. Remove filler words like "recipe", "make", "cook", "please", "thanks", etc.
3. Clean up and format the name in Title Case (e.g., "Chicken Tikka Masala")
4. Determine confidence level:
   - high: clear recipe request with obvious dish name
   - medium: food name identified but less certain
   - low: cannot identify a recipe name

EXAMPLES:
- "I want chicken tikka masala" → "Chicken Tikka Masala" (high confidence)
- "give me a pasta carbonara recipe" → "Pasta Carbonara" (high confidence)
- "how do I make chocolate chip cookies" → "Chocolate Chip Cookies" (high confidence)
- "looking for something with chicken" → unable to extract (low confidence)

Provide your extraction as a RecipeNameExtraction with:
- recipe_name: the extracted and formatted recipe name (or null if not found)
- confidence: 'high', 'medium', or 'low'
- reason: explanation of your extraction decision"""
        
        result = structured_model.invoke([SystemMessage(content=extraction_prompt)])
        return result.model_dump()
        
    except Exception as e:
        # Fallback
        result = RecipeNameExtraction(
            recipe_name=None,
            confidence="low",
            reason=f"Extraction failed: {str(e)}"
        )
        return result.model_dump()
