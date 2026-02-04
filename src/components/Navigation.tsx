"use client";

/**
 * Navigation Component
 * Top navigation bar for Aura Chef application
 * 
 * Features:
 * - Logo and app name
 * - New Chat button to create threads
 * - Threads dropdown to view and switch conversations
 * - Responsive design (full text on desktop, icons on mobile)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useThreadManager } from "@/hooks/useThreadManager";
import { ThreadsList } from "@/components/ThreadsList";
import { toast } from "react-hot-toast";

const THEME_COLOR = "#e86d4f";

export function Navigation() {
  const router = useRouter();
  const { createNewThread } = useThreadManager();
  const [showThreads, setShowThreads] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  const handleNewChat = async () => {
    try {
      setIsCreatingThread(true);
      await createNewThread();
      router.push("/chat");
      toast.success("New conversation started");
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create new conversation");
    } finally {
      setIsCreatingThread(false);
    }
  };

  const handleLogoClick = () => {
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-[var(--neutral-200)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and App Name */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xl shadow-md"
              style={{ backgroundColor: THEME_COLOR }}
            >
              🍲
            </div>
            <span className="hidden sm:block text-xl font-bold text-[var(--neutral-800)]">
              Aura Chef
            </span>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              disabled={isCreatingThread}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium text-white transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: THEME_COLOR }}
            >
              {isCreatingThread ? (
                <>
                  <div 
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  />
                  <span className="hidden sm:inline">Creating...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="hidden sm:inline">New Chat</span>
                </>
              )}
            </button>

            {/* Threads Button */}
            <div className="relative">
              <button
                onClick={() => setShowThreads(!showThreads)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium text-[var(--neutral-700)] bg-[var(--neutral-100)] hover:bg-[var(--neutral-200)] transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span className="hidden sm:inline">Threads</span>
              </button>

              {/* Threads Dropdown */}
              {showThreads && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowThreads(false)}
                  />
                  
                  {/* Dropdown Content */}
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 z-50">
                    <ThreadsList onClose={() => setShowThreads(false)} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
