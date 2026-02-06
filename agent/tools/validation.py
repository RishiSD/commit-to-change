"""Recipe validation and name extraction tools."""

from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate

from .models import RecipeNameExtraction
from utils.model import get_model
from utils.prompts import EXTRACT_RECIPE_NAME_PROMPT


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
        model = get_model()
        
        structured_model = model.with_structured_output(RecipeNameExtraction)
        
        prompt_template = ChatPromptTemplate.from_messages([
            (
                "system",
                EXTRACT_RECIPE_NAME_PROMPT,
            )
        ])

        prompt_messages = prompt_template.format_messages(text=text)
        result = structured_model.invoke(prompt_messages)
        return result.model_dump()
        
    except Exception as e:
        # Fallback
        result = RecipeNameExtraction(
            recipe_name=None,
            confidence="low",
            reason=f"Extraction failed: {str(e)}"
        )
        return result.model_dump()
