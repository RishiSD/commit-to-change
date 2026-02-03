/**
 * Custom hook for automatically persisting messages to Supabase
 * 
 * This hook:
 * - Provides callbacks to save messages when they're sent/received
 * - Automatically saves new messages to Supabase
 * - Handles both user and assistant messages
 * - Updates thread metadata
 * 
 * Usage:
 *   const { onMessage } = useMessagePersistence(activeThreadId);
 *   // Use onMessage callback in chat component
 */

"use client";

import { useCallback } from "react";
import { saveMessage } from "@/lib/supabase/chatHistory";
import { MessageRole } from "@/lib/types";

export interface UseMessagePersistenceResult {
  /** Save a message to the database */
  onMessage: (role: MessageRole, content: string) => Promise<void>;
}

export function useMessagePersistence(threadId: string | null): UseMessagePersistenceResult {
  const onMessage = useCallback(
    async (role: MessageRole, content: string) => {
      // Don't persist if no active thread
      if (!threadId) {
        console.warn("No active thread, message not saved");
        return;
      }

      // Skip empty messages
      if (!content.trim()) {
        return;
      }

      try {
        // Save to Supabase
        await saveMessage({
          thread_id: threadId,
          role,
          content: content.trim(),
          metadata: {
            timestamp: Date.now(),
          },
        });

        console.log(`Saved ${role} message: ${content.substring(0, 50)}...`);
      } catch (error) {
        console.error("Error persisting message:", error);
      }
    },
    [threadId]
  );

  return { onMessage };
}
