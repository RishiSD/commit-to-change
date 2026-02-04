"""
Agent V5 - Unified Recipe Extraction Tool.

Simplifies the workflow by combining extraction, validation, and formatting
into a single tool call with automatic follow-up link handling.
"""

import os
from typing import Optional, List

from langchain.chat_models import init_chat_model
from langchain.agents import create_agent
from copilotkit import CopilotKitState
from opik.integrations.langchain import OpikTracer, track_langgraph

# V5 uses the new unified tool
from tools.unified_extraction import extract_and_process_recipe
from tools.validation import extract_recipe_name
from tools.generation import generate_recipe_from_knowledge


# =============================================================================
# STATE SCHEMA
# =============================================================================

class AgentState(CopilotKitState):
    """
    State schema for Agent V5.
    
    Simplified compared to V4 since depth tracking is now handled internally
    by the unified extraction tool.
    """
    # Frontend-compatible fields
    recipe_url: Optional[str]
    recipe_json: Optional[dict]  # Changed from recipe_content (markdown)
    extracted_recipe_name: Optional[str]
    
    # Partial extraction data (for failed extractions with partial info)
    partial_extraction_content: Optional[str]
    partial_extraction_url: Optional[str]
    partial_has_ingredients: Optional[bool]
    partial_has_instructions: Optional[bool]
    partial_recipe_data: Optional[dict]
    
    # ReAct agent required
    remaining_steps: int
    
    # Tracking
    errors: List[str]


# =============================================================================
# SYSTEM PROMPT
# =============================================================================

SYSTEM_PROMPT = """You are an expert recipe extraction and generation assistant.

**Your Capabilities:**

1. **URL-Based Recipe Extraction** (SIMPLIFIED!)
   - Use extract_and_process_recipe(url) - ONE TOOL CALL
   - It automatically handles:
     * Content extraction (websites, Instagram, YouTube, TikTok)
     * Recipe validation (ingredients + instructions check)
     * Structured JSON formatting
     * Follow-up link detection and extraction (up to 1 additional URL)
   - Returns structured JSON recipe or detailed error
   - Store result in recipe_json state field

2. **Recipe Generation from Knowledge**
   - Use extract_recipe_name to identify recipe requests
   - Use generate_recipe_from_knowledge to create recipe with structured JSON
   - Store result['recipe_json'] in recipe_json state field
   - DO NOT generate any text response (the recipe card UI will be displayed automatically)

3. **General Conversation**
   - Answer cooking questions naturally
   - Guide users to provide URLs or recipe names

**Workflow Guidelines:**

For URLs:
- Single call to extract_and_process_recipe(url)
- Check result['success'] to see if extraction worked
- If success=True: Store result['recipe_json'] in recipe_json state field and STOP - do not say anything, do not acknowledge, do not confirm (the recipe card UI will be displayed automatically)
- If success=False: Check result['error'] and result['reason'] for details
  * If result['extracted_content'] exists (partial data available) OR result['recipe_name'] exists:
    - Store partial data in state: partial_extraction_content, partial_extraction_url, 
      partial_has_ingredients, partial_has_instructions, extracted_recipe_name
    - IMPORTANT: Also store partial_recipe_data (if available) - this contains structured ingredient/step data
    - IMPORTANT: Even if only recipe_name exists (no ingredients/instructions - e.g., TikTok video title), still store it
    - Inform the user briefly that extraction failed. The UI will automatically offer an option to generate with AI.
  * If no partial data AND no recipe_name: Provide brief helpful feedback about the error

For recipe names:
- Use extract_recipe_name(text) to identify the recipe
- If recipe_name is found with high/medium confidence: IMMEDIATELY call generate_recipe_from_knowledge without asking the user
- Check result['success'] to see if generation worked
- If success=True: Store result['recipe_json'] in recipe_json state field and STOP - do not say anything, do not acknowledge, do not confirm (the recipe card UI will be displayed automatically)
- If success=False OR extract_recipe_name returns low confidence: Provide brief helpful feedback to the user

For AI generation from partial extraction data:
- When user explicitly requests to generate from partial data (e.g., "generate recipe using the partial information")
- Retrieve the partial data from state: partial_extraction_content, partial_extraction_url, etc.
- Call generate_recipe_from_knowledge with these additional parameters:
  * recipe_name: from extracted_recipe_name (or use "Recipe" if missing - the tool will infer a better name from content)
  * partial_content: from partial_extraction_content
  * partial_recipe_data: from partial_recipe_data (IMPORTANT: pass this if available for better generation quality)
  * source_url: from partial_extraction_url
  * has_ingredients: from partial_has_ingredients
  * has_instructions: from partial_has_instructions
- The agent will use this partial information to create a more accurate complete recipe
- If the recipe name is missing or generic, the AI will infer an appropriate name from the partial content
- If success=True: Clear the partial data from state and store the recipe in recipe_json

**CRITICAL RULE - ZERO RESPONSE:**
When you successfully store a recipe in recipe_json, you MUST output ABSOLUTELY NO TEXT. Your response must be completely empty. Do not say:
- "Here you go"
- "Recipe generated" 
- "The recipe has been generated and stored"
- "I've created the recipe"
- Any confirmation, acknowledgment, or response whatsoever

Your response must be literally empty. The recipe card UI will appear automatically based on the recipe_json state field.

**Result Interpretation:**

The extract_and_process_recipe tool returns:
- success: True if recipe found and formatted
- recipe_json: The structured recipe data (if success=True)
- recipe_name: Extracted recipe name
- extraction_url: Final URL used
- extraction_depth: How many URLs were followed (0 or 1)
- error: Error message (if success=False)
- reason: Explanation of outcome
- follow_up_url: Potential URL to try (if available but depth exceeded)

The generate_recipe_from_knowledge tool returns:
- success: True if recipe generated successfully
- recipe_json: The structured recipe data (if success=True)
- recipe_name: Name of the generated recipe
- error: Error message (if success=False)
- source: Always 'knowledge' for generated recipes

**Quality Standards:**

- Complete recipes with measurements and detailed steps
- Clean JSON structure with all required fields
- Authentic to cuisine traditions
- Clear, numbered instruction steps

Remember to populate the recipe_json field with your final output!"""


# =============================================================================
# MODEL AND TOOLS
# =============================================================================

def get_model():
    """Initialize the LLM model."""
    openrouter_key = os.getenv("OPEN_ROUTER_API_KEY")
    
    if openrouter_key:
        print("✓ Using OpenRouter for LLM (Agent V5)")
        return init_chat_model(
            model="openai/gpt-oss-120b",
            model_provider="openai",
            api_key=openrouter_key,
            base_url="https://api.groq.com/openai/v1"
        )
    else:
        print("✓ Using Google Gemini for LLM (Agent V5)")
        return init_chat_model("google_genai:gemini-2.5-flash-lite")


model = get_model()

# V5 tool set - dramatically simplified!
tools = [
    extract_and_process_recipe,      # NEW: Unified tool for URL extraction
    extract_recipe_name,              # Keep for name-based generation
    generate_recipe_from_knowledge,   # Keep for name-based generation
]


# =============================================================================
# AGENT CREATION
# =============================================================================

def create_agent_graph(checkpointer):
    """
    Create the agent graph with the provided checkpointer.
    
    Args:
        checkpointer: LangGraph checkpointer (e.g., AsyncPostgresSaver)
        
    Returns:
        Compiled agent graph with persistence
    """
    agent = create_agent(
        model=model,
        tools=tools,
        state_schema=AgentState,
        system_prompt=SYSTEM_PROMPT,
        checkpointer=checkpointer,
    )
    
    return agent


# =============================================================================
# OPIK TRACING FACTORY
# =============================================================================

def create_agent_with_opik(agent):
    """
    Wrap the agent with Opik tracing.
    
    Args:
        agent: The compiled LangGraph agent
        
    Returns:
        Agent wrapped with Opik observability
    """
    opik_tracer = OpikTracer(
        tags=["aura-chef", "recipe-extraction", "agent-v5", "unified-tool"],
        project_name="playground",
        graph=agent.get_graph(xray=True)
    )
    
    tracked_agent = track_langgraph(agent, opik_tracer)
    return tracked_agent


# =============================================================================
# EXPORTS
# =============================================================================

__all__ = ["create_agent_graph", "create_agent_with_opik", "AgentState", "get_model"]
