"use client";

import { WeatherCard } from "@/components/weather";
import { MoonCard } from "@/components/moon";
import { RecipeSearchCard } from "@/components/recipe-search";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import {
  CatchAllActionRenderProps,
  useCoAgent,
  useCopilotAction,
  useFrontendTool,
  useHumanInTheLoop,
  useRenderToolCall,
} from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotChat } from "@copilotkit/react-ui";
import { useEffect } from "react";

const THEME_COLOR = "#e86d4f";

export function ChatInterface() {
  return (
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
    className="relative h-screen w-full overflow-hidden bg-[var(--neutral-50)]"
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
  );
}

function YourMainContent() {
  // 🪁 Shared State: https://docs.copilotkit.ai/pydantic-ai/shared-state
  const { state, setState } = useCoAgent({
    name: "sample_agent",
  });

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

  //🪁 Generative UI: https://docs.copilotkit.ai/pydantic-ai/generative-ui
  useRenderToolCall({
    name: "get_weather",
    description: "Get the weather for a given location.",
    parameters: [{ name: "location", type: "string", required: true }],
    render: ({ args }) => {
      return <WeatherCard location={args.location} themeColor={THEME_COLOR} />;
    },
  });


  // 🪁 Human In the Loop: https://docs.copilotkit.ai/pydantic-ai/human-in-the-loop
  useHumanInTheLoop({
    name: "go_to_moon",
    description: "Go to the moon on request.",
    render: ({ respond, status }) => {
      return (
        <MoonCard themeColor={THEME_COLOR} status={status} respond={respond} />
      );
    },
  });

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
        return (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl shadow-md">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Could not extract recipe
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
    render: ({ name, args, status, result }: CatchAllActionRenderProps<[]>) => {
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
                labels={{
                  title: 'Aura Chef Assistant',
                  initial: "👋 Hi there! I'm your culinary AI assistant. How can I help you today?",
                }}
                suggestions={[
                {
                  title: 'Generative UI',
                  message: 'Get the weather in San Francisco.',
                },
                {
                  title: 'AI Recipe Generation',
                  message: 'I want a recipe for chicken tikka masala.',
                },
                {
                  title: 'Human In the Loop',
                  message: 'Please go to the moon.',
                },
                {
                  title: 'Write Agent State',
                  message: 'Add a proverb about AI.',
                },
                {
                  title: 'Update Agent State',
                  message:
                    'Please remove 1 random proverb from the list if there are any.',
                },
                {
                  title: 'Read Agent State',
                  message: 'What are the proverbs?',
                },
              ]}
            />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
