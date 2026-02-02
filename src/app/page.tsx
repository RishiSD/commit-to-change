"use client";

import { LandingPage } from "@/components/landing/LandingPage";
import { ChatInterface } from "@/components/ChatInterface";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useState, useLayoutEffect } from "react";

export default function Home() {
  const { session, isLoading } = useSupabaseAuth();
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting - hydration detection pattern
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state while checking authentication
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--neutral-50)]">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4"
            style={{ borderColor: 'var(--primary-500)' }}
          ></div>
          <p className="text-[var(--neutral-600)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated, otherwise show chat interface
  return session ? <ChatInterface /> : <LandingPage />;
}
