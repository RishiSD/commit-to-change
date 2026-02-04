"use client";

/**
 * Chat Page
 * Dedicated route for chat interface
 * 
 * Features:
 * - Renders ChatInterface with Navigation
 * - Handles initial message from URL params (for extract recipe flow)
 * - Maintains auth protection
 */

import { useEffect, useState, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { ChatInterface } from "@/components/ChatInterface";

export default function ChatPage() {
  const { session, isLoading } = useSupabaseAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting - hydration detection pattern
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/");
    }
  }, [session, isLoading, router]);

  // Show loading state while checking authentication or mounting
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--neutral-50)]">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4"
            style={{ borderColor: "var(--primary-500)" }}
          ></div>
          <p className="text-[var(--neutral-600)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  return <ChatInterface />;
}
