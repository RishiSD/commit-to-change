"""
Pydantic models for structured tool outputs and state management.

These models provide type safety, validation, and clear interfaces between
agent nodes and tools. All tools in agent_v3 return instances of these models
instead of plain dictionaries.
"""

from typing import Optional, List, Literal, Union
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


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


class RecipeIngredient(BaseModel):
    """
    Single ingredient in a recipe with quantity and unit.
    """
    name: str = Field(description="Ingredient name (e.g., 'All-purpose flour')")
    quantity: Union[float, str] = Field(
        description="Quantity as number or string (e.g., 2.5, '2-3', 'to taste')"
    )
    unit: str = Field(
        description="Unit of measurement (e.g., 'cups', 'g', 'cloves', 'pinch')"
    )
    
    class Config:
        extra = "forbid"  # Ensures additionalProperties: false
        json_schema_extra = {
            "example": {
                "name": "All-purpose flour",
                "quantity": 2.5,
                "unit": "cups"
            }
        }


class RecipeJSON(BaseModel):
    """
    Structured JSON representation of a recipe.
    
    Used by: extract_and_process_recipe, generate_recipe_from_knowledge (Agent V5)
    """
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique recipe identifier (UUID)"
    )
    title: str = Field(description="Recipe name/title")
    ingredients: List[RecipeIngredient] = Field(
        description="List of ingredients with quantities"
    )
    steps: List[str] = Field(
        description="Ordered list of instruction steps"
    )
    tags: List[str] = Field(
        default_factory=list,
        description="Descriptive tags (cuisine, diet, difficulty, etc.)"
    )
    created_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z",
        description="Creation timestamp (ISO 8601 format)"
    )
    
    # Optional metadata fields
    servings: Optional[int] = Field(
        default=None,
        description="Number of servings"
    )
    prep_time: Optional[str] = Field(
        default=None,
        description="Preparation time (e.g., '15 minutes')"
    )
    cook_time: Optional[str] = Field(
        default=None,
        description="Cooking time (e.g., '30 minutes')"
    )
    total_time: Optional[str] = Field(
        default=None,
        description="Total time (e.g., '45 minutes')"
    )
    difficulty: Optional[Literal["easy", "medium", "hard"]] = Field(
        default=None,
        description="Recipe difficulty level"
    )
    cuisine: Optional[str] = Field(
        default=None,
        description="Cuisine type (e.g., 'Italian', 'Indian')"
    )
    source_url: Optional[str] = Field(
        default=None,
        description="Original URL where recipe was extracted from"
    )
    additional_info: Optional[List[str]] = Field(
        default=None,
        description="Additional information like tips, storage instructions, substitutions, serving suggestions"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Creamy Garlic Pasta",
                "ingredients": [
                    {"name": "Pasta", "quantity": 200, "unit": "g"},
                    {"name": "Garlic", "quantity": 3, "unit": "cloves"}
                ],
                "steps": [
                    "Boil pasta according to package instructions",
                    "Prepare garlic cream sauce",
                    "Combine pasta with sauce and serve"
                ],
                "tags": ["quick", "vegetarian", "italian"],
                "created_at": "2026-01-29T10:15:00Z",
                "servings": 4,
                "prep_time": "10 minutes",
                "cook_time": "15 minutes",
                "total_time": "25 minutes",
                "difficulty": "easy",
                "cuisine": "Italian",
                "source_url": "https://example.com/recipe",
                "additional_info": [
                    "Use high-quality pasta for best results",
                    "Can substitute cream with milk and butter",
                    "Store leftovers in airtight container for up to 3 days"
                ]
            }
        }


class GeneratedRecipe(BaseModel):
    """
    Result from recipe generation from LLM knowledge.
    
    Returned by: generate_recipe_from_knowledge
    """
    success: bool = Field(
        description="Whether recipe generation succeeded"
    )
    recipe_json: Optional[dict] = Field(
        default=None,
        description="Generated recipe as RecipeJSON structure (only if success=True)"
    )
    recipe_name: str = Field(
        description="Name of the generated recipe"
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if generation failed"
    )
    source: Literal["knowledge"] = Field(
        default="knowledge",
        description="Source of recipe (always 'knowledge' for generated recipes)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "recipe_json": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "title": "Chicken Tikka Masala",
                    "ingredients": [{"name": "Chicken", "quantity": 500, "unit": "g"}],
                    "steps": ["Marinate chicken", "Cook in sauce"],
                    "tags": ["indian", "main-course"],
                    "created_at": "2026-01-29T10:15:00Z"
                },
                "recipe_name": "Chicken Tikka Masala",
                "error": None,
                "source": "knowledge"
            }
        }


class RecipeDataForLLM(BaseModel):
    """
    Recipe data structure for LLM structured output.
    
    Similar to RecipeJSON but without auto-generated fields (id, created_at).
    Used by ValidateAndFormatOutput for OpenAI structured output compatibility.
    """
    title: str = Field(description="Recipe name/title")
    ingredients: List[RecipeIngredient] = Field(
        description="List of ingredients with quantities"
    )
    steps: List[str] = Field(
        description="Ordered list of instruction steps"
    )
    tags: List[str] = Field(
        default_factory=list,
        description="Descriptive tags (cuisine, diet, difficulty, etc.)"
    )
    
    # Optional metadata fields
    servings: Optional[int] = Field(
        default=None,
        description="Number of servings"
    )
    prep_time: Optional[str] = Field(
        default=None,
        description="Preparation time (e.g., '15 minutes')"
    )
    cook_time: Optional[str] = Field(
        default=None,
        description="Cooking time (e.g., '30 minutes')"
    )
    total_time: Optional[str] = Field(
        default=None,
        description="Total time (e.g., '45 minutes')"
    )
    difficulty: Optional[Literal["easy", "medium", "hard"]] = Field(
        default=None,
        description="Recipe difficulty level"
    )
    cuisine: Optional[str] = Field(
        default=None,
        description="Cuisine type (e.g., 'Italian', 'Indian')"
    )
    additional_info: Optional[List[str]] = Field(
        default=None,
        description="Additional information like tips, storage instructions, substitutions, serving suggestions"
    )
    
    class Config:
        extra = "forbid"  # This ensures additionalProperties: false in JSON schema


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
    recipe_data: Optional[RecipeDataForLLM] = Field(
        default=None,
        description="Structured recipe data (only if valid recipe) - will be converted to RecipeJSON"
    )
    partial_recipe_data: Optional[RecipeDataForLLM] = Field(
        default=None,
        description="Partial/incomplete recipe data extracted from invalid recipe (when has_ingredients or has_instructions is True)"
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
        extra = "forbid"  # Ensures additionalProperties: false for all fields
        json_schema_extra = {
            "example": {
                "is_valid_recipe": True,
                "recipe_data": {
                    "title": "Chocolate Chip Cookies",
                    "ingredients": [
                        {"name": "Flour", "quantity": 2, "unit": "cups"}
                    ],
                    "steps": ["Mix ingredients", "Bake at 350F"],
                    "tags": ["dessert", "easy"],
                    "servings": 24,
                    "prep_time": "15 minutes",
                    "cook_time": "12 minutes",
                    "additional_info": [
                        "Chill dough for 30 minutes for thicker cookies",
                        "Store in airtight container for up to 1 week"
                    ]
                },
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
    recipe_json: Optional[dict] = Field(
        default=None,
        description="Final formatted recipe as JSON (only if success=True)"
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
    extracted_content: Optional[str] = Field(
        default=None,
        description="Raw extracted content (only populated when extraction fails with partial data)"
    )
    partial_recipe_data: Optional[dict] = Field(
        default=None,
        description="Partial structured recipe data (when extraction failed but partial info available)"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "recipe_json": {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "title": "Chocolate Chip Cookies",
                    "ingredients": [{"name": "Flour", "quantity": 2, "unit": "cups"}],
                    "steps": ["Mix ingredients", "Bake"],
                    "tags": ["dessert"],
                    "created_at": "2026-01-29T10:15:00Z"
                },
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
