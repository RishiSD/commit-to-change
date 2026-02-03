/**
 * Supabase Chat History Service
 * 
 * This module provides functions for managing chat threads and messages in Supabase.
 * All operations respect Row Level Security (RLS) policies - users can only
 * access their own chat threads and messages.
 * 
 * Database Tables:
 * - chat_threads: Groups messages into conversations
 *   - id: UUID (primary key)
 *   - user_id: UUID (foreign key to auth.users)
 *   - title: TEXT (auto-generated from first message)
 *   - last_message_at: TIMESTAMPTZ
 *   - created_at: TIMESTAMPTZ
 *   - updated_at: TIMESTAMPTZ
 * 
 * - chat_messages: Individual messages within threads
 *   - id: UUID (primary key)
 *   - thread_id: UUID (foreign key to chat_threads)
 *   - user_id: UUID (foreign key to auth.users)
 *   - role: TEXT ('user', 'assistant', 'system')
 *   - content: TEXT
 *   - metadata: JSONB (optional extra data)
 *   - created_at: TIMESTAMPTZ
 */

import { supabase } from "@/lib/supabase/client";
import { 
  ChatThread, 
  ChatMessage, 
  CreateThreadInput, 
  CreateMessageInput 
} from "@/lib/types";

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

/**
 * Get all messages for a thread
 * 
 * @param threadId - UUID of the thread
 * @returns Promise<ChatMessage[]> - Array of messages sorted chronologically
 * @throws Error if fetch fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const messages = await getThreadMessages("123e4567-e89b-12d3-a456-426614174000");
 * messages.forEach(msg => {
 *   console.log(`${msg.role}: ${msg.content}`);
 * });
 * ```
 */
export async function getThreadMessages(threadId: string): Promise<ChatMessage[]> {
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
 * Save a message to a thread
 * 
 * @param input - Message data to save
 * @returns Promise<ChatMessage> - The created message
 * @throws Error if save fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const message = await saveMessage({
 *   thread_id: "123e4567-e89b-12d3-a456-426614174000",
 *   role: "user",
 *   content: "How do I make carbonara?",
 *   metadata: { timestamp: Date.now() }
 * });
 * ```
 */
export async function saveMessage(input: CreateMessageInput): Promise<ChatMessage> {
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
 * Delete a specific message
 * 
 * @param messageId - UUID of the message to delete
 * @returns Promise<void>
 * @throws Error if delete fails, user is not authenticated, or message not found
 * 
 * @example
 * ```typescript
 * await deleteMessage("123e4567-e89b-12d3-a456-426614174000");
 * ```
 */
export async function deleteMessage(messageId: string): Promise<void> {
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
