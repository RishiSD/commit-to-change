/**
 * Custom hook for managing chat threads and message persistence
 * 
 * This hook provides:
 * - Thread creation and management
 * - Automatic message persistence to Supabase
 * - Thread switching with history loading
 * - Integration with CopilotKit's threadId system
 * 
 * Usage:
 *   const { threads, activeThread, createNewThread, switchThread, deleteThread } = useThreadManager();
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useCopilotContext } from "@copilotkit/react-core";
import { ChatThread } from "@/lib/types";
import {
  getThreads,
  createThread,
  deleteThread as deleteThreadDB,
} from "@/lib/supabase/chatHistory";
import { toast } from "react-hot-toast";

export interface UseThreadManager {
  /** List of all user threads */
  threads: ChatThread[];
  
  /** Currently active thread */
  activeThread: ChatThread | null;
  
  /** Whether threads are being loaded */
  isLoading: boolean;
  
  /** Create a new thread and switch to it */
  createNewThread: () => Promise<void>;
  
  /** Switch to an existing thread */
  switchThread: (threadId: string) => Promise<void>;
  
  /** Delete a thread */
  deleteThread: (threadId: string) => Promise<void>;
  
  /** Refresh the thread list */
  refreshThreads: () => Promise<void>;
}

export function useThreadManager(): UseThreadManager {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedThread, setHasCheckedThread] = useState(false);
  
  const { setThreadId } = useCopilotContext();

  /**
   * Load all threads from Supabase
   */
  const loadThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedThreads = await getThreads();
      setThreads(fetchedThreads);
    } catch (error) {
      console.error("Error loading threads:", error);
      toast.error("Failed to load chat history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new thread and switch to it
   */
  const createNewThread = useCallback(async () => {
    try {
      // Create thread in Supabase
      const newThread = await createThread();
      
      // Update local state
      setThreads(prev => [newThread, ...prev]);
      setActiveThread(newThread);
      
      // Set CopilotKit threadId to switch conversation
      setThreadId(newThread.id);
      
      // Mark as checked since we just created a new thread
      setHasCheckedThread(true);
      
      toast.success("New conversation started");
    } catch (error) {
      console.error("Error creating thread:", error);
      toast.error("Failed to create new conversation");
    }
  }, [setThreadId]);

  /**
   * Switch to an existing thread
   */
  const switchThread = useCallback(async (threadId: string) => {
    try {
      // Find the thread in our list
      const thread = threads.find(t => t.id === threadId);
      if (!thread) {
        toast.error("Thread not found");
        return;
      }

      // Update active thread
      setActiveThread(thread);
      
      // Switch CopilotKit to this thread (this will load messages automatically)
      setThreadId(threadId);
      
      // Mark as checked - we're intentionally loading an existing thread
      // This prevents the useEffect from creating a new thread
      setHasCheckedThread(true);
      
      console.log(`Switched to thread: ${thread.title}`);
    } catch (error) {
      console.error("Error switching thread:", error);
      toast.error("Failed to switch conversation");
    }
  }, [threads, setThreadId]);

  /**
   * Delete a thread
   */
  const handleDeleteThread = useCallback(async (threadId: string) => {
    try {
      // Delete from Supabase
      await deleteThreadDB(threadId);
      
      // Update local state
      setThreads(prev => prev.filter(t => t.id !== threadId));
      
      // If we deleted the active thread, switch to another if available
      if (activeThread?.id === threadId) {
        const nextThread = threads.find(t => t.id !== threadId);
        if (nextThread) {
          await switchThread(nextThread.id);
        } else {
          setActiveThread(null);
          setHasCheckedThread(true);
        }
      }
      
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting thread:", error);
      toast.error("Failed to delete conversation");
    }
  }, [activeThread, switchThread, threads]);

  /**
   * Refresh threads list
   */
  const refreshThreads = useCallback(async () => {
    await loadThreads();
  }, [loadThreads]);

  // Load threads on mount
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Thread selection on load (no auto-creation)
  useEffect(() => {
    // Skip if still loading or already checked
    if (isLoading || hasCheckedThread) return;
    
    // Threads exist but none active → Load most recent thread
    if (threads.length > 0 && !activeThread) {
      console.log("Loading most recent thread");
      switchThread(threads[0].id);
      return;
    }

    // No threads or active thread already set → mark as checked
    setHasCheckedThread(true);
  }, [isLoading, threads, activeThread, hasCheckedThread, switchThread]);

  return {
    threads,
    activeThread,
    isLoading,
    createNewThread,
    switchThread,
    deleteThread: handleDeleteThread,
    refreshThreads,
  };
}
