"use client";

import { WeatherCard } from "@/components/weather";
import { MoonCard } from "@/components/moon";
import { RecipeSearchCard } from "@/components/recipe-search";
import {
  useCoAgent,
  useDefaultTool,
  useFrontendTool,
  useHumanInTheLoop,
  useRenderToolCall,
} from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotChat } from "@copilotkit/react-ui";

const THEME_COLOR = "#9333ea";

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
      className="relative h-screen w-screen overflow-hidden"
    >
      {/* Dark gradient background matching landing page */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: "linear-gradient(to bottom, #0a0a0a 0%, #1a0a2e 50%, #0a0a0a 100%)"
        }}
      />

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
    render: ({ status }) => {
      // Show loading state during extraction
      if (status === "inProgress" || status === "executing") {
        return (
          <div className="flex items-center gap-2 text-gray-600 text-sm py-2 px-3 bg-gray-50 rounded-lg">
            <div 
              className="h-4 w-4 border-2 rounded-full animate-spin"
              style={{ 
                borderColor: THEME_COLOR,
                borderTopColor: 'transparent'
              }}
            />
            <span>Extracting recipe from URL...</span>
          </div>
        );
      }
      
      // Return empty div when complete (agent will provide formatted response)
      return <div className="hidden" />;
    },
  });

  return (
    <div className="w-full max-w-4xl mx-auto" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Chat container with clean card design */}
      <div className="relative w-full h-full">
        {/* Bright glow effect */}
        <div 
          style={{ 
            boxShadow: `0 0 80px ${THEME_COLOR}99, 0 0 150px ${THEME_COLOR}66`
          }}
          className="absolute inset-0 rounded-3xl blur-2xl"
        />
        
        {/* Main chat card */}
        <div className="relative bg-white rounded-3xl shadow-2xl h-full flex flex-col overflow-hidden">
          {/* Chat interface wrapper with proper height */}
          <div className="flex-1 min-h-0">
            <CopilotChat
              className="h-full"
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
  );
}
