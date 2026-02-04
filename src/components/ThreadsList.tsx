"use client";

/**
 * ThreadsList Component
 * Displays a list of conversation threads with ability to switch and delete
 * 
 * Features:
 * - Shows all user threads ordered by most recent
 * - Highlights active thread
 * - Click to switch threads
 * - Delete button with confirmation
 * - Empty state when no threads exist
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useThreadManager } from "@/hooks/useThreadManager";
import { useCopilotContext } from "@copilotkit/react-core";
import { ChatThread } from "@/lib/types";
import { toast } from "react-hot-toast";

interface ThreadsListProps {
  onClose: () => void;
}

export function ThreadsList({ onClose }: ThreadsListProps) {
  const router = useRouter();
  const { threads, isLoading, switchThread, deleteThread } = useThreadManager();
  const { threadId: activeThreadId } = useCopilotContext();
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleThreadClick = async (thread: ChatThread) => {
    try {
      await switchThread(thread.id);
      router.push("/chat");
      onClose();
    } catch (error) {
      console.error("Error switching thread:", error);
      toast.error("Failed to switch conversation");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation(); // Prevent thread click
    setConfirmDeleteId(threadId);
  };

  const handleConfirmDelete = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    try {
      setDeletingThreadId(threadId);
      await deleteThread(threadId);
      setConfirmDeleteId(null);
      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting thread:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setDeletingThreadId(null);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-[var(--neutral-200)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--neutral-200)] bg-[var(--neutral-50)]">
        <h3 className="text-sm font-semibold text-[var(--neutral-800)]">
          Recent Conversations
        </h3>
      </div>

      {/* Thread List */}
      <div className="max-h-96 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-sm text-[var(--neutral-600)]">
              No conversations yet
            </p>
            <p className="text-xs text-[var(--neutral-500)] mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            const isConfirmingDelete = confirmDeleteId === thread.id;
            const isDeleting = deletingThreadId === thread.id;

            return (
              <div
                key={thread.id}
                className={`
                  px-4 py-3 border-b border-[var(--neutral-100)] cursor-pointer transition-colors
                  ${isActive ? "bg-[var(--primary-50)]" : "hover:bg-[var(--neutral-50)]"}
                  ${isDeleting ? "opacity-50" : ""}
                `}
                onClick={() => !isConfirmingDelete && handleThreadClick(thread)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">📝</span>
                      <h4 className={`text-sm font-medium truncate ${
                        isActive ? "text-[var(--primary-700)]" : "text-[var(--neutral-800)]"
                      }`}>
                        {thread.title}
                      </h4>
                    </div>
                    <p className="text-xs text-[var(--neutral-500)]">
                      {formatTimestamp(thread.last_message_at || thread.created_at)}
                    </p>
                  </div>

                  {/* Delete Button */}
                  {!isConfirmingDelete ? (
                    <button
                      onClick={(e) => handleDeleteClick(e, thread.id)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-lg text-[var(--neutral-400)] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete conversation"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => handleConfirmDelete(e, thread.id)}
                        className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={handleCancelDelete}
                        className="px-2 py-1 text-xs font-medium text-[var(--neutral-700)] bg-[var(--neutral-200)] hover:bg-[var(--neutral-300)] rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
