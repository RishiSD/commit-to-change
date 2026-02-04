"use client";

/**
 * HomePage Component
 * Main authenticated landing page showing recipe options
 * 
 * Features:
 * - Two-card grid layout with gradient backgrounds
 * - Extract Recipe from URL (opens modal)
 * - Generate AI Recipe (navigates to chat)
 * - Floating orb background effects
 * - Responsive design
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useThreadManager } from "@/hooks/useThreadManager";
import { ExtractRecipeModal } from "@/components/modals/ExtractRecipeModal";
import { Navigation } from "@/components/Navigation";
import { toast } from "react-hot-toast";

const THEME_COLOR = "#e86d4f";

export function HomePage() {
  const router = useRouter();
  const { createNewThread } = useThreadManager();
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  const handleGenerateRecipe = async () => {
    try {
      setIsCreatingThread(true);
      await createNewThread();
      toast.success("Starting new conversation...");
      router.push("/chat");
    } catch (error) {
      console.error("Error creating thread:", error);
      toast.error("Failed to start conversation");
    } finally {
      setIsCreatingThread(false);
    }
  };

  return (
    <main
      style={
        {
          "--copilot-kit-primary-color": THEME_COLOR,
        } as React.CSSProperties
      }
      className="relative h-screen w-full overflow-hidden bg-[var(--neutral-50)]"
    >
      {/* Navigation */}
      <Navigation />

      {/* Floating orbs background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          style={{
            background: `radial-gradient(circle at 20% 30%, ${THEME_COLOR}30, transparent 50%)`,
          }}
          className="absolute top-20 left-10 w-96 h-96 rounded-full blur-3xl animate-float-slow"
        />
        <div
          style={{
            background: `radial-gradient(circle at 80% 70%, #ec489930, transparent 50%)`,
          }}
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-float-slower"
        />
      </div>

      {/* Content container */}
      <div className="relative h-full w-full flex items-center justify-center p-4 md:p-8">
        <div className="max-w-6xl w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--neutral-800)] mb-4">
              Welcome to <span style={{ color: THEME_COLOR }}>Aura Chef</span>
            </h1>
            <p className="text-lg text-[var(--neutral-600)] max-w-2xl mx-auto">
              Your AI-powered culinary assistant. Extract recipes from the web or generate custom recipes from your favorite ingredients.
            </p>
          </div>

          {/* Options Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* Card 1: Extract Recipe */}
            <div
              className="group relative bg-gradient-to-br from-[#e86d4f] to-[#d85f40] rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-3xl cursor-pointer"
              onClick={() => setShowExtractModal(true)}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-[#e86d4f]" />

              <div className="relative p-8 md:p-10 text-white">
                {/* Icon */}
                <div className="mb-6 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">
                  Extract Recipe from URL
                </h2>
                <p className="text-white/90 text-center mb-6 text-sm md:text-base">
                  Import recipes from popular cooking sites like AllRecipes, NYT Cooking, Food Network, and more
                </p>

                {/* Button */}
                <button className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl font-semibold transition-all duration-300 group-hover:border-white/50">
                  Get Started
                </button>

                {/* Supported formats hint */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/70">
                  <span>Supports:</span>
                  <span className="font-medium">Websites • Instagram • YouTube • TikTok</span>
                </div>
              </div>
            </div>

            {/* Card 2: Generate AI Recipe */}
            <div
              className="group relative bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-3xl cursor-pointer"
              onClick={handleGenerateRecipe}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-[#8b5cf6]" />

              <div className="relative p-8 md:p-10 text-white">
                {/* Icon */}
                <div className="mb-6 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">
                  Generate AI Recipe
                </h2>
                <p className="text-white/90 text-center mb-6 text-sm md:text-base">
                  Create custom recipes from ingredients or get inspired by cuisine and dish names
                </p>

                {/* Button */}
                <button
                  disabled={isCreatingThread}
                  className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl font-semibold transition-all duration-300 group-hover:border-white/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingThread ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    "Start Creating"
                  )}
                </button>

                {/* Examples hint */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/70">
                  <span>Try:</span>
                  <span className="font-medium">&quot;Chicken Tikka Masala&quot; • &quot;Pasta with mushrooms&quot;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer hint */}
          <div className="text-center mt-12">
            <p className="text-sm text-[var(--neutral-500)]">
              Start with a quick option above or{" "}
              <button
                onClick={() => router.push("/chat")}
                className="text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium underline"
              >
                open chat directly
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Extract Recipe Modal */}
      <ExtractRecipeModal
        isOpen={showExtractModal}
        onClose={() => setShowExtractModal(false)}
      />
    </main>
  );
}
