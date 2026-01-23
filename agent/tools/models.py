"""
Pydantic models for structured tool outputs and state management.

These models provide type safety, validation, and clear interfaces between
agent nodes and tools. All tools in agent_v3 return instances of these models
instead of plain dictionaries.
"""

from typing import Optional, List, Literal
from pydantic import BaseModel, Field


class ExtractionResult(BaseModel):
    """
    Result from URL content extraction.
    
    Returned by: extract_url_content, follow_recipe_link
    """
    content: str = Field(description="Extracted text content from the URL")
    success: bool = Field(description="Whether extraction succeeded")
    title: str = Field(description="Page/content title")
    url: str = Field(description="URL that was extracted from")
    error: Optional[str] = Field(
        default=None, 
        description="Error message if extraction failed"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "content": "Chocolate Chip Cookies\n\nIngredients:\n- 2 cups flour...",
                "success": True,
                "title": "Chocolate Chip Cookies Recipe",
                "url": "https://example.com/recipe",
                "error": None
            }
        }


class ValidationResult(BaseModel):
    """
    Result from recipe content validation.
    
    Returned by: validate_recipe_content
    """
    is_valid_recipe: bool = Field(
        description="True if content contains a complete recipe"
    )
    recipe_name: Optional[str] = Field(
        default=None, 
        description="Extracted recipe name/title"
    )
    has_ingredients: bool = Field(
        description="Whether an ingredients list with quantities exists"
    )
    has_instructions: bool = Field(
        description="Whether step-by-step instructions exist"
    )
    reason: str = Field(
        description="Explanation of validation decision"
    )
    confidence: float = Field(
        ge=0.0, 
        le=1.0, 
        description="Confidence score from 0.0 to 1.0"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "is_valid_recipe": True,
                "recipe_name": "Chocolate Chip Cookies",
                "has_ingredients": True,
                "has_instructions": True,
                "reason": "Found complete ingredients list with measurements and detailed step-by-step instructions",
                "confidence": 0.95
            }
        }


class RecipeNameExtraction(BaseModel):
    """
    Result from recipe name extraction from user text.
    
    Returned by: extract_recipe_name
    """
    recipe_name: Optional[str] = Field(
        default=None, 
        description="Extracted and title-cased recipe name"
    )
    confidence: Literal["high", "medium", "low"] = Field(
        description="Extraction confidence level"
    )
    reason: str = Field(
        description="Explanation of extraction decision"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "recipe_name": "Chicken Tikka Masala",
                "confidence": "high",
                "reason": "Clear recipe request pattern with specific dish name"
            }
        }


class FormattedRecipe(BaseModel):
    """
    Final formatted recipe output in markdown.
    
    Returned by: format_recipe_markdown
    """
    markdown: str = Field(
        description="Complete recipe formatted in markdown"
    )
    recipe_name: str = Field(
        description="Recipe title/name"
    )
    sections: List[str] = Field(
        description="List of sections present in the recipe"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "markdown": "# Chocolate Chip Cookies\n\n## Ingredients\n- 2 cups flour\n...",
                "recipe_name": "Chocolate Chip Cookies",
                "sections": ["ingredients", "instructions", "additional_info"]
            }
        }


class IntentClassification(BaseModel):
    """
    Result from user intent classification.
    
    Used by: classify_intent_node to determine workflow routing
    """
    intent: Literal["url_extraction", "name_generation", "general"] = Field(
        description="Classified user intent type"
    )
    confidence: float = Field(
        ge=0.0, 
        le=1.0, 
        description="Classification confidence score"
    )
    reasoning: str = Field(
        description="Explanation of why this intent was chosen"
    )
    extracted_entities: dict = Field(
        default_factory=dict,
        description="Extracted entities like URLs, recipe names, etc."
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "intent": "url_extraction",
                "confidence": 0.98,
                "reasoning": "User provided explicit URL for recipe extraction",
                "extracted_entities": {
                    "urls": ["https://example.com/recipe"],
                    "recipe_names": []
                }
            }
        }


class GeneratedRecipe(BaseModel):
    """
    Result from recipe generation from LLM knowledge.
    
    Returned by: generate_recipe_from_knowledge
    """
    markdown: str = Field(
        description="Generated recipe in markdown format"
    )
    recipe_name: str = Field(
        description="Name of the generated recipe"
    )
    source: Literal["knowledge"] = Field(
        default="knowledge",
        description="Source of recipe (always 'knowledge' for generated recipes)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "markdown": "# Chicken Tikka Masala\n\n## Ingredients...",
                "recipe_name": "Chicken Tikka Masala",
                "source": "knowledge"
            }
        }


class ValidateAndFormatOutput(BaseModel):
    """
    Combined validation and formatting result from LLM.
    
    Used internally by: extract_and_process_recipe (Agent V5)
    
    This model is used for structured output from a single LLM call that
    performs both validation and formatting, reducing the number of LLM
    invocations required.
    """
    is_valid_recipe: bool = Field(
        description="True if content contains a complete recipe"
    )
    recipe_markdown: Optional[str] = Field(
        default=None,
        description="Formatted recipe markdown (only if valid recipe)"
    )
    recipe_name: Optional[str] = Field(
        default=None,
        description="Extracted recipe name/title"
    )
    has_ingredients: bool = Field(
        description="Whether ingredients list with quantities exists"
    )
    has_instructions: bool = Field(
        description="Whether step-by-step instructions exist"
    )
    follow_up_url: Optional[str] = Field(
        default=None,
        description="URL to follow if recipe not found (only if invalid recipe)"
    )
    follow_up_confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence in follow-up URL (0.0-1.0)"
    )
    reason: str = Field(
        description="Explanation of validation/formatting decision"
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Overall confidence score (0.0-1.0)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "is_valid_recipe": True,
                "recipe_markdown": "# Chocolate Chip Cookies\n\n## Ingredients...",
                "recipe_name": "Chocolate Chip Cookies",
                "has_ingredients": True,
                "has_instructions": True,
                "follow_up_url": None,
                "follow_up_confidence": 0.0,
                "reason": "Found complete recipe with ingredients and instructions",
                "confidence": 0.95
            }
        }


class UnifiedRecipeResult(BaseModel):
    """
    Final result from unified extraction tool.
    
    Returned by: extract_and_process_recipe (Agent V5)
    
    This model represents the complete result of the unified extraction,
    validation, and formatting operation, including automatic follow-up
    link handling.
    """
    success: bool = Field(
        description="Whether a valid recipe was successfully extracted and formatted"
    )
    recipe_markdown: Optional[str] = Field(
        default=None,
        description="Final formatted recipe in markdown (only if success=True)"
    )
    recipe_name: Optional[str] = Field(
        default=None,
        description="Extracted recipe name"
    )
    extraction_url: str = Field(
        description="Final URL that content was extracted from"
    )
    
    # Validation info
    is_valid_recipe: bool = Field(
        description="Whether content was validated as a complete recipe"
    )
    has_ingredients: bool = Field(
        description="Whether ingredients list was found"
    )
    has_instructions: bool = Field(
        description="Whether instructions were found"
    )
    
    # Follow-up tracking
    follow_up_url: Optional[str] = Field(
        default=None,
        description="Potential follow-up URL (if recipe not found and depth exceeded)"
    )
    extraction_depth: int = Field(
        description="Number of URLs followed (0 = initial, 1 = followed one link)"
    )
    
    # Error/status
    error: Optional[str] = Field(
        default=None,
        description="Error message if extraction/validation failed"
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Overall confidence in result (0.0-1.0)"
    )
    reason: str = Field(
        description="Explanation of the outcome"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "recipe_markdown": "# Chocolate Chip Cookies\n\n## Ingredients...",
                "recipe_name": "Chocolate Chip Cookies",
                "extraction_url": "https://example.com/recipe",
                "is_valid_recipe": True,
                "has_ingredients": True,
                "has_instructions": True,
                "follow_up_url": None,
                "extraction_depth": 0,
                "error": None,
                "confidence": 0.95,
                "reason": "Complete recipe found with ingredients and instructions"
            }
        }
