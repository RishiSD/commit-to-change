/**
 * @deprecated This hook is no longer needed. Message persistence is now handled 
 * automatically by the LangGraph agent's PostgreSQL checkpointer.
 * 
 * MIGRATION NOTE:
 * - Messages are persisted in the agent's checkpoint tables (checkpoints, checkpoint_writes)
 * - CopilotKit automatically loads message history when switching threads
 * - No manual message saving is required from the frontend
 * 
 * Previously: Frontend manually saved messages to chat_messages table
 * Now: Agent checkpointer handles all persistence automatically
 * 
 * This file is kept for reference only and should be removed in future versions.
 */

"use client";

import { useCallback } from "react";
import { MessageRole } from "@/lib/types";

export interface UseMessagePersistenceResult {
  /** @deprecated Message persistence is now handled by agent checkpointer */
  onMessage: (role: MessageRole, content: string) => Promise<void>;
}

/**
 * @deprecated Use thread management with CopilotKit's built-in persistence instead.
 * See useThreadManager hook for thread operations.
 */
export function useMessagePersistence(threadId: string | null): UseMessagePersistenceResult {
  const onMessage = useCallback(
    async (role: MessageRole, content: string) => {
      console.warn(
        "useMessagePersistence is deprecated. Messages are now persisted by the agent's checkpointer."
      );
      // No-op: Agent handles persistence
    },
    [threadId]
  );

  return { onMessage };
}
