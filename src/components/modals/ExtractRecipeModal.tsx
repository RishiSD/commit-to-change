"use client";

/**
 * ExtractRecipeModal Component
 * Modal for extracting recipes from URLs
 * 
 * Features:
 * - URL input with validation
 * - Creates new thread and sends extraction message
 * - Navigates to chat interface after submission
 * - Loading state during submission
 * - Error handling with toasts
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";

interface ExtractRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExtractRecipeModal({ isOpen, onClose }: ExtractRecipeModalProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidURL = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate URL
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!isValidURL(url)) {
      toast.error("Please enter a valid URL (starting with http:// or https://)");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Store the URL in sessionStorage to be picked up by chat interface
      sessionStorage.removeItem("pendingFlowThreadCreated");
      sessionStorage.setItem("pendingExtractUrl", url);

      // 2. Success feedback
      toast.success("Opening chat...");

      // 3. Close modal and reset
      onClose();
      setUrl("");

      // 4. Navigate to chat
      router.push("/chat");
    } catch (error) {
      console.error("Error starting recipe extraction:", error);
      toast.error("Failed to start extraction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setUrl("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Extract Recipe from URL" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <p className="text-sm text-[var(--neutral-600)]">
            Paste the URL of a recipe from any popular cooking website. We support AllRecipes, 
            Food Network, NYT Cooking, and many more.
          </p>

          <div>
            <label htmlFor="recipe-url" className="block text-sm font-medium text-[var(--neutral-700)] mb-2">
              Recipe URL
            </label>
            <Input
              id="recipe-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/recipe"
              disabled={isSubmitting}
              autoFocus
              className="w-full"
            />
          </div>

          <div className="p-3 bg-[var(--neutral-50)] rounded-lg border border-[var(--neutral-200)]">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-[var(--primary-500)] flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-xs text-[var(--neutral-600)]">
                <p className="font-medium mb-1">Supported formats:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Recipe website URLs</li>
                  <li>Instagram recipe posts</li>
                  <li>YouTube recipe videos</li>
                  <li>TikTok recipe videos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            type="button"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || !url.trim()}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              "Extract Recipe"
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
