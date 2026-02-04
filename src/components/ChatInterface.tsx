"use client";

import { RecipeSearchCard } from "@/components/recipe-search";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Navigation } from "@/components/Navigation";
import {
  CatchAllActionRenderProps,
  useCoAgent,
  useCopilotAction,
  useFrontendTool,
  useHumanInTheLoop,
  useRenderToolCall,
  useCopilotChat,
} from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotChat, useCopilotChatSuggestions } from "@copilotkit/react-ui";
import { useEffect, useState, useRef } from "react";
import { AgentState } from "@/lib/types";
import { TextMessage, MessageRole } from "@copilotkit/runtime-client-gql";

const THEME_COLOR = "#e86d4f";

/**
 * Generates context-aware instructions for AI-powered chat suggestions.
 * Analyzes the current agent state to provide relevant, actionable suggestions.
 * 
 * @param state - Current agent state including recipe data, errors, and processing stage
 * @param isRecipeGeneration - Whether user came from "Generate AI Recipe" flow
 * @returns Instruction string for the AI to generate appropriate suggestions
 */
function generateSuggestionInstructions(state: AgentState | undefined, isRecipeGeneration: boolean = false): string {
  // Handle undefined state
  if (!state) {
    // Show recipe generation suggestions if in that flow
    if (isRecipeGeneration) {
      return `User wants to generate a custom AI recipe. Suggest 3-4 creative ways to start:
- Generate by dish name (e.g., "Create a recipe for chicken tikka masala", "Make me pasta carbonara")
- Generate by cuisine (e.g., "Suggest an Italian appetizer", "Create a Thai curry recipe")
- Generate by ingredients (e.g., "I have chicken, tomatoes, and basil", "Recipe using salmon and asparagus")
- Generate by dietary needs (e.g., "Vegetarian pasta recipe", "Keto-friendly dinner")
Make suggestions specific, creative, and inspiring.`;
    }
    
    return `Suggest 3-4 helpful ways to get started with Aura Chef. Focus on:
- Extracting recipes from popular sites (AllRecipes, Food Network, NYT Cooking)
- Generating recipes by name (e.g., "chicken tikka masala", "pasta carbonara")
- Asking cooking questions and getting culinary advice
Make suggestions specific, actionable, and conversational.`;
  }

  // Recipe is loaded - provide recipe-specific suggestions
  if (state.recipe_json) {
    const recipe = state.recipe_json;
    const cuisine = recipe.cuisine ? `${recipe.cuisine} ` : '';
    const ingredientCount = recipe.ingredients?.length || 0;
    const servings = recipe.servings || 'unspecified';
    const difficulty = recipe.difficulty || 'medium';
    
    return `A ${cuisine}recipe for "${recipe.title}" is currently displayed with ${ingredientCount} ingredients, serves ${servings}, difficulty: ${difficulty}.

Suggest 3-4 relevant follow-up actions that are SPECIFIC to this recipe. Examples:
- Scaling: "Scale this recipe for 6 people" or "Adjust servings to 2"
- Ingredient substitutions: "What can I substitute for [specific ingredient from the recipe]?"
- Cooking techniques: "Explain the [technique mentioned in steps] technique"
- Pairing suggestions: "What wine pairs well with ${recipe.title}?"
- Side dishes: "What side dish would go well with this?"
- Cooking timeline: "Create a cooking timeline for this recipe"
- Similar recipes: "Find similar ${cuisine}recipes"
- Next meal: "Suggest a dessert to complete this meal"

Make suggestions conversational, specific to the loaded recipe's context, and immediately actionable.`;
  }

  // Processing state - minimal suggestions during operations
  if (state.processing_stage) {
    return `The assistant is currently processing: ${state.processing_stage}.

Suggest 1-2 brief, non-disruptive actions:
- What they could do after this completes
- Related tasks they might want to queue up

Keep suggestions short and respectful of the ongoing operation.`;
  }

  // Default/initial state - getting started suggestions
  return `Suggest 3-4 helpful ways to interact with Aura Chef. Focus on:
- Extracting recipes from URLs (mention specific popular sites like AllRecipes, Food Network, Bon Appétit)
- Generating recipes by name with cuisine variety (Italian, Indian, Mexican, etc.)
- Asking cooking questions (techniques, ingredient info, meal planning)
- Getting culinary advice and tips

Make suggestions diverse, specific, and appealing to different user intents.`;
}

export function ChatInterface() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--neutral-50)]">
      {/* Navigation at top */}
      <Navigation />
      
      {/* Chat content */}
      <main
        style={
          {
            "--copilot-kit-primary-color": THEME_COLOR,
            "--copilot-kit-contrast-color": "#ffffff",
            "--copilot-kit-secondary-contrast-color": "#1f2937",
            "--copilot-kit-background-color": "#ffffff",
            "--copilot-kit-secondary-color": "#f3f4f6",
            "--copilot-kit-muted-color": "#64748b",
            "--copilot-kit-separator-color": "rgba(0, 0, 0, 0.08)",
            "--copilot-kit-scrollbar-color": "rgba(147, 51, 234, 0.2)",
          } as CopilotKitCSSProperties
        }
        className="relative flex-1 w-full overflow-hidden"
      >
      {/* Floating orbs background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          style={{ 
            background: `radial-gradient(circle at 20% 30%, ${THEME_COLOR}30, transparent 50%)`
          }}
          className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl animate-float-slow"
        />
        <div 
          style={{ 
            background: `radial-gradient(circle at 80% 70%, #ec489930, transparent 50%)`
          }}
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-float-slower"
        />
      </div>

      {/* Content container */}
      <div className="relative h-full w-full flex items-center justify-center p-4 md:p-8">
        <YourMainContent />
      </div>
    </main>
    </div>
  );
}

function YourMainContent() {
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const [isRecipeGeneration, setIsRecipeGeneration] = useState(false);
  const appendMessageRef = useRef<((message: TextMessage) => void) | null>(null);
  
  // 🪁 Shared State: https://docs.copilotkit.ai/pydantic-ai/shared-state
  const { state, setState } = useCoAgent({
    name: "sample_agent",
  });

  // Get chat methods for programmatic message sending
  const { appendMessage } = useCopilotChat();
  
  // Store appendMessage in ref so it can be accessed from button clicks
  useEffect(() => {
    appendMessageRef.current = appendMessage;
  }, [appendMessage]);

  // Check for pending extraction URL or recipe generation flow on mount
  useEffect(() => {
    const pendingUrl = sessionStorage.getItem("pendingExtractUrl");
    const isRecipeGenFlow = sessionStorage.getItem("recipeGenerationFlow");
    
    if (pendingUrl) {
      setInitialMessage(`Extract recipe from ${pendingUrl}`);
      sessionStorage.removeItem("pendingExtractUrl");
    } else if (isRecipeGenFlow) {
      setIsRecipeGeneration(true);
      sessionStorage.removeItem("recipeGenerationFlow");
    }
  }, []);

  // Auto-send the initial message if present
  useEffect(() => {
    if (initialMessage && !hasAutoSent) {
      // Small delay to ensure chat is fully mounted
      const timer = setTimeout(() => {
        appendMessage(
          new TextMessage({
            role: MessageRole.User,
            content: initialMessage,
          })
        );
        setHasAutoSent(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [initialMessage, hasAutoSent, appendMessage]);

  // 🪁 Dynamic Chat Suggestions: Context-aware suggestions based on agent state
  // Automatically generates relevant suggestions that adapt to:
  // - Initial state (getting started)
  // - Recipe generation flow (AI recipe creation)
  // - Recipe loaded (recipe-specific actions)
  // - Processing state (minimal disruption)
  // - General conversation (diverse cooking tasks)
  useCopilotChatSuggestions(
    {
      instructions: generateSuggestionInstructions(state, isRecipeGeneration),
      minSuggestions: 2,
      maxSuggestions: 4,
    },
    [
      state?.recipe_json,              // Recipe content changes
      state?.recipe_json?.title,       // Recipe details
      state?.recipe_json?.cuisine,     // Cuisine-specific suggestions
      state?.recipe_json?.ingredients, // Ingredient-aware suggestions
      state?.processing_stage,         // Processing status
      isRecipeGeneration,              // Recipe generation flow
    ]
  );

  // Note: threadId is managed by CopilotKit and used internally for persistence
  // Messages are now persisted automatically by the agent's PostgreSQL checkpointer

  // Hide tool call result JSON messages from chat - only show custom UI from useRenderToolCall
  useEffect(() => {
    const hideToolResults = () => {
      // Find all assistant messages in the chat
      const messages = document.querySelectorAll('.copilotKitAssistantMessage, .copilotKitMessage');
      
      messages.forEach((message) => {
        const text = message.textContent || '';
        
        // Check if this message contains tool result JSON patterns
        const hasToolResultPattern = 
          (text.includes('"success"') && text.includes('"recipe_json"')) ||
          (text.includes('"success"') && text.includes('"error"') && text.includes('extraction')) ||
          (text.includes('"success"') && text.includes('"source"') && text.includes('knowledge'));
        
        // Check if message contains code blocks or pre tags (where JSON is typically rendered)
        const hasCodeBlock = message.querySelector('pre, code') !== null;
        
        // Hide messages that contain tool results in code blocks
        if (hasToolResultPattern && hasCodeBlock) {
          (message as HTMLElement).style.display = 'none';
        }
      });
    };

    // Run initially and whenever new messages might be added
    hideToolResults();
    
    // Set up a MutationObserver to handle dynamically added messages
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          hideToolResults();
        }
      });
    });

    // Observe the chat messages container
    const chatContainer = document.querySelector('.copilotKitMessages, .copilotKitMessagesContainer');
    if (chatContainer) {
      observer.observe(chatContainer, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  // 🪁 Frontend Actions: https://docs.copilotkit.ai/coagents/frontend-actions
  useFrontendTool({
    name: "updateProverbs",
    description: "Update the list of proverbs. Always describe what the proverbs you added are.",
    parameters: [
      {
        name: "proverbs",
        description: "What the current list of proverbs should be updated to",
        type: "string[]",
        required: true,
      },
    ],
    handler: ({ proverbs }) => {
      setState({
        ...state,
        proverbs: proverbs,
      });
    },
  });

  // 🪁 Frontend tool to provide extracted content to agent for AI generation
  useFrontendTool({
    name: "get_partial_extraction_data",
    description: "Get the partial extraction data from a failed recipe extraction. Call this when the user asks to generate a recipe from partial extraction data.",
    parameters: [],
    handler: () => {
      // Return the extracted content stored in state
      return {
        extracted_content: state?.extracted_content || null,
        recipe_name: state?.extracted_recipe_name || null,
      };
    },
  });

  // //🪁 Generative UI: https://docs.copilotkit.ai/pydantic-ai/generative-ui
  // useRenderToolCall({
  //   name: "get_weather",
  //   description: "Get the weather for a given location.",
  //   parameters: [{ name: "location", type: "string", required: true }],
  //   render: ({ args }) => {
  //     return <WeatherCard location={args.location} themeColor={THEME_COLOR} />;
  //   },
  // });


  // // 🪁 Human In the Loop: https://docs.copilotkit.ai/pydantic-ai/human-in-the-loop
  // useHumanInTheLoop({
  //   name: "go_to_moon",
  //   description: "Go to the moon on request.",
  //   render: ({ respond, status }) => {
  //     return (
  //       <MoonCard themeColor={THEME_COLOR} status={status} respond={respond} />
  //     );
  //   },
  // });

  // 🪁 Recipe Generation: Human-in-the-loop for AI-generated recipes
  useHumanInTheLoop({
    name: "provide_recipe_from_knowledge",
    description: "Ask user if they want a recipe generated from AI knowledge when they request a recipe by name without providing a URL.",
    parameters: [
      {
        name: "recipe_name",
        type: "string",
        description: "The name of the recipe the user requested",
        required: true,
      },
    ],
    render: ({ args, respond, status }) => {
      return (
        <RecipeSearchCard
          recipeName={args.recipe_name || "Unknown Recipe"}
          themeColor={THEME_COLOR}
          status={status}
          respond={respond}
        />
      );
    },
  });

  // 🪁 Recipe Extraction: Custom UI for URL-based recipe extraction
  useRenderToolCall({
    name: "extract_and_process_recipe",
    description: "Extract and process recipe from URL",
    parameters: [
      {
        name: "url",
        type: "string",
        description: "URL to extract recipe from",
        required: true,
      },
    ],
    render: ({ status, args, result }) => {
      // Show loading state during extraction
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="flex items-center gap-3 p-4 bg-[var(--primary-50)] border-2 border-[var(--primary-200)] rounded-2xl shadow-md">
            <div 
              className="h-5 w-5 border-3 rounded-full animate-spin"
              style={{ 
                borderWidth: '3px',
                borderColor: 'var(--primary-500)',
                borderTopColor: 'transparent'
              }}
            />
            <div>
              <p className="text-sm font-semibold text-[var(--primary-800)]">
                Extracting recipe from URL...
              </p>
              <p className="text-xs text-[var(--primary-600)] mt-0.5">
                {args.url && new URL(args.url).hostname}
              </p>
            </div>
          </div>
        );
      }

      // Show recipe card when extraction is complete and successful
      if (status === "complete" && result?.success && result?.recipe_json) {
        console.log(
          'Recipe extraction error:',
          JSON.stringify(result, null, 2),
        );
        return <RecipeCard recipe={result.recipe_json} />;
      }

      // Show error state if extraction failed
      if (status === "complete" && !result?.success) {
        const hasPartialData = result?.has_ingredients || result?.has_instructions;
        const hasRecipeName = result?.recipe_name && result.recipe_name.trim().length > 0;
        const hasExtractedContent = result?.extracted_content && result?.extracted_content.trim().length > 0;
        
        // Can generate if we have:
        // 1. Partial data (ingredients/instructions) with extracted content, OR
        // 2. Just a recipe name (even without full content - e.g., from TikTok title)
        const canGenerateWithAI = (hasPartialData && hasExtractedContent) || hasRecipeName;
        
        return (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl shadow-md">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  Could not extract recipe
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {result?.reason || result?.error || "Unknown error occurred"}
                </p>
                
                {canGenerateWithAI && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-xs text-red-700 mb-2">
                      {hasPartialData && hasExtractedContent 
                        ? `We found partial recipe information${result?.recipe_name ? ` for "${result.recipe_name}"` : ''}. Would you like to generate a complete recipe using AI?`
                        : `We found a recipe name${result?.recipe_name ? ` "${result.recipe_name}"` : ''} but no full recipe. Would you like to generate a complete recipe using AI?`
                      }
                    </p>
                    <button
                      onClick={() => {
                        // Send a message to trigger AI generation with partial data
                        if (appendMessageRef.current) {
                          const recipeName = result.recipe_name || "the recipe from this source";
                          appendMessageRef.current(
                            new TextMessage({
                              role: MessageRole.User,
                              content: `Generate a complete recipe using the partial information you extracted${result.recipe_name ? ` for "${result.recipe_name}"` : ''}.`,
                            })
                          );
                        }
                      }}
                      className="px-4 py-2 bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                      style={{
                        backgroundColor: THEME_COLOR,
                      }}
                    >
                      Generate Recipe with AI
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      return <div className="hidden" />;
    },
  });

  // 🪁 Recipe Generation: Custom UI for AI-generated recipes
  useRenderToolCall({
    name: "generate_recipe_from_knowledge",
    description: "Generate recipe from AI knowledge",
    parameters: [
      {
        name: "recipe_name",
        type: "string",
        description: "Name of recipe to generate",
        required: true,
      },
    ],
    render: ({ status, args, result }) => {
      // Show loading state during generation
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="flex items-center gap-3 p-4 bg-[var(--secondary-50)] border-2 border-[var(--secondary-200)] rounded-2xl shadow-md">
            <div 
              className="h-5 w-5 border-3 rounded-full animate-spin"
              style={{ 
                borderWidth: '3px',
                borderColor: 'var(--secondary-500)',
                borderTopColor: 'transparent'
              }}
            />
            <div>
              <p className="text-sm font-semibold text-[var(--secondary-800)]">
                Generating recipe from knowledge...
              </p>
              <p className="text-xs text-[var(--secondary-600)] mt-0.5">
                {args.recipe_name}
              </p>
            </div>
          </div>
        );
      }

      // Show recipe card when generation is complete and successful
      if (status === "complete" && result?.success && result?.recipe_json) {
        return <RecipeCard recipe={result.recipe_json} />;
      }

      // Show error state if generation failed
      if (status === "complete" && !result?.success) {
        return (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl shadow-md">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Could not generate recipe
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {result?.error || "Unknown error occurred"}
                </p>
              </div>
            </div>
          </div>
        );
      }

      return <div className="hidden" />;
    },
  });

  useCopilotAction({
    name: '*',
    render: ({ name, args, status }: CatchAllActionRenderProps<[]>) => {
      return (
        <div className="m-4 p-4 bg-gray-100 rounded shadow">
          <h2 className="text-sm font-medium">Tool: {name}</h2>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(args, null, 2)}
          </pre>
          {status === 'complete' && (
            <div className="mt-2 text-xs text-green-600">✓ Complete</div>
          )}
        </div>
      );
    },
  });

  return (
    // Make chat use the full available width
    <div className="w-full px-0 max-w-full overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="relative w-full h-full">
        {/* Single full-width chat column */}
        <div className="w-full h-full">
          <div className="relative bg-white rounded-3xl shadow-2xl h-full flex flex-col overflow-hidden">
            {/* Bright glow effect behind chat */}
            <div 
              style={{ 
                boxShadow: `0 0 80px ${THEME_COLOR}99, 0 0 150px ${THEME_COLOR}66`
              }}
              className="absolute inset-0 rounded-3xl blur-2xl pointer-events-none"
            />
            {/* Chat interface wrapper with proper height */}
            <div className="flex-1 min-h-0">
              <CopilotChat
                className="h-full w-full"
                disableSystemMessage={true}
                suggestions="auto"
                labels={{
                  title: 'Aura Chef Assistant',
                  initial: initialMessage || (isRecipeGeneration 
                    ? "What delicious recipe shall we create together? Tell me a dish name, cuisine style, or ingredients you'd like to use! 🍳✨"
                    : "Ready to turn any recipe URL into cooking magic or generate AI-powered recipes? Drop a link or ask me to create something delicious! ✨"),
                }}
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
