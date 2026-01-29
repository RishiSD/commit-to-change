/**
 * UserMenu component displays logged-in user information with a dropdown menu.
 * 
 * Features:
 * - User avatar or initials
 * - User email display
 * - Sign out button
 * - Positioned in top-right corner
 * - Responsive design
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { User } from "@supabase/supabase-js";

interface UserMenuProps {
  /** Current authenticated user */
  user: User;
  
  /** Sign out handler */
  onSignOut: () => Promise<void>;
  
  /** Theme color to match the app */
  themeColor?: string;
}

export function UserMenu({ user, onSignOut, themeColor = "#6366f1" }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Get user initials for avatar
  const getInitials = (email: string): string => {
    const name = user.user_metadata?.full_name || user.user_metadata?.name || email;
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get display name
  const getDisplayName = (): string => {
    return user.user_metadata?.full_name || 
           user.user_metadata?.name || 
           user.email?.split("@")[0] || 
           "User";
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await onSignOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-40" ref={menuRef}>
      {/* User avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white rounded-full shadow-lg px-4 py-2 hover:shadow-xl transition-shadow duration-200"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {/* Avatar with user photo or initials */}
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={getDisplayName()}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div
            style={{ backgroundColor: themeColor }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
          >
            {getInitials(user.email || "")}
          </div>
        )}
        
        {/* User name (hidden on mobile) */}
        <span className="hidden sm:block text-sm font-medium text-gray-700">
          {getDisplayName()}
        </span>
        
        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* User info section */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-medium text-gray-900">
              {getDisplayName()}
            </p>
            <p className="text-xs text-gray-600 truncate mt-1">
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningOut ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sign out</span>
                </>
              )}
            </button>
          </div>

          {/* Footer with user role (if available) */}
          {user.role && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                Role: <span className="font-medium">{user.role}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
