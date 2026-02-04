/**
 * Supabase Chat History Service
 * 
 * This module provides functions for managing chat threads in Supabase.
 * All operations respect Row Level Security (RLS) policies - users can only
 * access their own chat threads.
 * 
 * IMPORTANT MIGRATION NOTE (Feb 2026):
 * - Message persistence is now handled by LangGraph's PostgreSQL checkpointer
 * - The agent automatically stores messages in checkpoint tables
 * - Message-related functions below are DEPRECATED and kept for reference only
 * - Only thread management functions are actively used
 * 
 * Database Tables:
 * - chat_threads: Thread metadata (title, timestamps) - ACTIVE
 * - chat_messages: Individual messages - DEPRECATED (use checkpoint tables instead)
 * 
 * New Tables (LangGraph Auto-Created):
 * - checkpoints: Agent state snapshots (includes messages)
 * - checkpoint_writes: Pending writes queue
 * - checkpoint_migrations: Schema version tracking
 */

import { supabase } from "@/lib/supabase/client";
import { 
  ChatThread, 
  ChatMessage, 
  CreateThreadInput, 
  CreateMessageInput 
} from "@/lib/types";

// =============================================================================
// THREAD MANAGEMENT (ACTIVE - STILL IN USE)
// =============================================================================

/**
 * Create a new chat thread
 * 
 * @param input - Thread creation data (title is optional)
 * @returns Promise<ChatThread> - The created thread
 * @throws Error if creation fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const thread = await createThread({ title: "Recipe Discussion" });
 * // Or auto-generate title:
 * const thread = await createThread();
 * ```
 */
export async function createThread(input?: CreateThreadInput): Promise<ChatThread> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }
  
  const user = session.user;

  // Insert thread
  const { data, error } = await supabase
    .from('chat_threads')
    .insert({
      user_id: user.id,
      title: input?.title || 'New Conversation',
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating thread:", error);
    throw new Error(`Failed to create thread: ${error.message}`);
  }

  return data;
}

/**
 * Get all chat threads for the current user
 * 
 * @returns Promise<ChatThread[]> - Array of threads sorted by most recent
 * @throws Error if fetch fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const threads = await getThreads();
 * console.log(`You have ${threads.length} conversations`);
 * ```
 */
export async function getThreads(): Promise<ChatThread[]> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }

  // Fetch all threads for the user, sorted by most recent activity
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .order('last_message_at', { ascending: false });

  if (error) {
    console.error("Error fetching threads:", error);
    throw new Error(`Failed to fetch threads: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single thread by ID
 * 
 * @param threadId - UUID of the thread
 * @returns Promise<ChatThread | null> - The thread or null if not found
 * @throws Error if fetch fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const thread = await getThread("123e4567-e89b-12d3-a456-426614174000");
 * if (thread) {
 *   console.log(`Thread: ${thread.title}`);
 * }
 * ```
 */
export async function getThread(threadId: string): Promise<ChatThread | null> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }

  // Fetch the thread (RLS ensures user can only access their own)
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('id', threadId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching thread:", error);
    throw new Error(`Failed to fetch thread: ${error.message}`);
  }

  return data;
}

/**
 * Delete a thread and all its messages
 * 
 * @param threadId - UUID of the thread to delete
 * @returns Promise<void>
 * @throws Error if delete fails, user is not authenticated, or thread not found
 * 
 * @example
 * ```typescript
 * await deleteThread("123e4567-e89b-12d3-a456-426614174000");
 * ```
 */
export async function deleteThread(threadId: string): Promise<void> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }

  // Delete the thread (CASCADE will delete all messages)
  const { error } = await supabase
    .from('chat_threads')
    .delete()
    .eq('id', threadId);

  if (error) {
    console.error("Error deleting thread:", error);
    throw new Error(`Failed to delete thread: ${error.message}`);
  }
}

/**
 * Update a thread's title
 * 
 * @param threadId - UUID of the thread to update
 * @param title - New title for the thread
 * @returns Promise<ChatThread> - The updated thread
 * @throws Error if update fails, user is not authenticated, or thread not found
 * 
 * @example
 * ```typescript
 * const updated = await updateThreadTitle(
 *   "123e4567-e89b-12d3-a456-426614174000",
 *   "Pasta Recipes Discussion"
 * );
 * ```
 */
export async function updateThreadTitle(threadId: string, title: string): Promise<ChatThread> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }

  // Update the thread title
  const { data, error } = await supabase
    .from('chat_threads')
    .update({ title })
    .eq('id', threadId)
    .select()
    .single();

  if (error) {
    console.error("Error updating thread title:", error);
    throw new Error(`Failed to update thread title: ${error.message}`);
  }

  return data;
}

// =============================================================================
// MESSAGE OPERATIONS (DEPRECATED - USE LANGGRAPH CHECKPOINTS)
// =============================================================================

/**
 * @deprecated Messages are now persisted automatically by LangGraph checkpointer.
 * This function is kept for backward compatibility but should not be used.
 * 
 * Get all messages for a thread
 * 
 * NOTE: For new threads, messages are stored in LangGraph checkpoint tables.
 * Use CopilotKit's built-in message loading instead.
 */
export async function getThreadMessages(threadId: string): Promise<ChatMessage[]> {
  console.warn(
    "getThreadMessages is deprecated. Messages are now in LangGraph checkpoint tables."
  );
  
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }

  // Fetch all messages for the thread, sorted chronologically
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }

  return data || [];
}

/**
 * @deprecated Messages are now persisted automatically by LangGraph checkpointer.
 * This function is kept for backward compatibility but should not be used.
 * 
 * Save a message to a thread
 */
export async function saveMessage(input: CreateMessageInput): Promise<ChatMessage> {
  console.warn(
    "saveMessage is deprecated. Messages are now persisted by LangGraph checkpointer."
  );
  
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }
  
  const user = session.user;

  // Insert message
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: input.thread_id,
      user_id: user.id,
      role: input.role,
      content: input.content,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving message:", error);
    throw new Error(`Failed to save message: ${error.message}`);
  }

  return data;
}

/**
 * @deprecated Messages are now persisted automatically by LangGraph checkpointer.
 * This function is kept for backward compatibility but should not be used.
 * 
 * Delete a specific message
 */
export async function deleteMessage(messageId: string): Promise<void> {
  console.warn(
    "deleteMessage is deprecated. Messages are now in LangGraph checkpoint tables."
  );
  
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }

  // Delete the message (RLS ensures user can only delete their own)
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error("Error deleting message:", error);
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

/**
 * Get the most recent thread for the current user
 * Useful for auto-resuming the last conversation
 * 
 * @returns Promise<ChatThread | null> - The most recent thread or null if none exist
 * @throws Error if fetch fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const lastThread = await getMostRecentThread();
 * if (lastThread) {
 *   console.log(`Resume: ${lastThread.title}`);
 * }
 * ```
 */
export async function getMostRecentThread(): Promise<ChatThread | null> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }

  // Fetch the most recent thread
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching most recent thread:", error);
    throw new Error(`Failed to fetch most recent thread: ${error.message}`);
  }

  return data;
}

/**
 * Check if a thread has any user messages by querying the checkpoint system
 * 
 * @param threadId - UUID of the thread to check
 * @returns Promise<boolean> - True if thread has user messages, false otherwise
 * @throws Error if check fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const hasMessages = await threadHasUserMessages(threadId);
 * if (!hasMessages) {
 *   console.log("Thread is empty, can reuse");
 * }
 * ```
 */
export async function threadHasUserMessages(threadId: string): Promise<boolean> {
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session?.user) {
    throw new Error("User not authenticated");
  }

  try {
    // Query the checkpoints table to check for user messages
    // The checkpoint data contains the agent state with messages
    const { data, error } = await supabase
      .from('checkpoints')
      .select('checkpoint')
      .eq('thread_id', threadId)
      .order('checkpoint_id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error checking thread messages:", error);
      // If we can't check, assume it has messages (safer default)
      return true;
    }

    // If no checkpoint exists, thread is empty
    if (!data) {
      return false;
    }

    // Parse the checkpoint data to check for user messages
    const checkpoint = data.checkpoint;
    if (!checkpoint || typeof checkpoint !== 'object') {
      return false;
    }

    // The checkpoint contains channel data with messages
    // CopilotKit stores messages in the 'messages' channel
    const channelData = (checkpoint as { channel_values?: { messages?: unknown[] } }).channel_values;
    if (!channelData || !channelData.messages) {
      return false;
    }

    const messages = channelData.messages;
    if (!Array.isArray(messages)) {
      return false;
    }

    // Check if any message has role "user"
    return messages.some((msg: unknown) => {
      const message = msg as { type?: string; role?: string };
      return message.type === 'human' || message.role === 'user';
    });
  } catch (err) {
    console.error("Error in threadHasUserMessages:", err);
    // If we can't determine, assume it has messages (safer default)
    return true;
  }
}
