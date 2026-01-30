/**
 * DeleteRecipeModal - Confirmation dialog before deleting a recipe
 * Part of Aura Chef Design System
 */

"use client";

import { Modal, ModalFooter, Button } from "@/components/ui";

interface DeleteRecipeModalProps {
  recipeName: string;
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteRecipeModal({
  recipeName,
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteRecipeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : onCancel}
      size="sm"
      showCloseButton={false}
    >
      {/* Header with warning icon */}
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--error)', opacity: 0.1 }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--error)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-[var(--neutral-800)]">Delete Recipe</h3>
        </div>
      </div>

      {/* Body */}
      <div className="mb-6">
        <p className="text-[var(--neutral-700)] mb-2">
          Are you sure you want to delete <span className="font-semibold">&quot;{recipeName}&quot;</span>?
        </p>
        <p className="text-sm text-[var(--neutral-600)]">
          This action cannot be undone. The recipe will be permanently removed from your collection.
        </p>
      </div>

      {/* Footer */}
      <ModalFooter className="px-0 py-0 border-0 bg-transparent mt-0">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={isDeleting}
          isLoading={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Recipe"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
