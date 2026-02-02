"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// import { UserMenu } from "@/components/auth/UserMenu";
import { User } from "@supabase/supabase-js";

interface SidebarProps {
  user: User | null;
  onSignOut: () => Promise<void>;
  themeColor: string;
  // Controlled collapsed state from parent (layout)
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export function Sidebar({ user, onSignOut, themeColor, collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      href: "/recipes",
      label: "My Recipes",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
        {/* Mobile open button (burger) - visible when sidebar is collapsed on small screens */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-lg lg:hidden border border-gray-200"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Overlay for mobile only */}
        {!collapsed && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setCollapsed(true)}
          />
        )}

       {/* Sidebar (relative/flex on lg+, fixed drawer on mobile) */}
        {/* Mobile: Only show <aside> when expanded. Desktop: always present */}
          <aside
            className={`fixed z-50 top-0 left-0 h-screen bg-[var(--copilot-kit-background-color)] shadow-xl transition-all duration-300 ease-in-out flex flex-col ${
              collapsed ? 'hidden lg:flex lg:w-16' : 'w-64'
            }`}
            style={{ transitionProperty: 'width, transform' }}
          >
        {/* Toggle Button */}
         {/* Sidebar toggle: Always show button on desktop; on mobile, show burger in app shell */}
          {/* Desktop: floating toggle (half outside the sidebar edge) */}
            <button
             onClick={() => setCollapsed(!collapsed)}
             className="hidden lg:flex items-center justify-center absolute -right-4 top-1/2 transform -translate-y-1/2 rounded-full p-2 hover:shadow-lg transition-all duration-200 focus:outline-none"
             aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
             style={{ background: 'white', border: '1px solid var(--neutral-200)', boxShadow: '0 8px 22px rgba(232,109,79,0.08)' }}
           >
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${collapsed ? 'rotate-180' : 'rotate-0'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Mobile: close button inside the open drawer */}
          <button
            onClick={() => setCollapsed(true)}
            className="lg:hidden absolute right-3 top-3 bg-white rounded-md p-1.5 border border-gray-200 shadow-sm"
            aria-label="Close sidebar"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

        {/* Sidebar Content */}
              <div className="flex flex-col h-full">
          {/* Logo/Brand */}
           <div className="flex items-center h-16 px-4 border-b" style={{ borderColor: 'var(--neutral-200)' }}>
            {!collapsed ? (
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl">🍳</span>
                <span className="font-bold text-lg text-[var(--primary-500)]">
                  Aura Chef
                </span>
              </Link>
            ) : (
              <Link href="/" className="flex items-center justify-center w-full">
                <span className="text-2xl">🍳</span>
              </Link>
            )}
          </div>

          {/* Navigation Items */}
            <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              // When a nav item is clicked: on mobile close the drawer; on desktop do not change collapse state
              const handleNavClick = () => {
                if (typeof window === "undefined") return;
                if (window.innerWidth < 1024) {
                  // On small screens, close the drawer after navigation
                  setCollapsed(true);
                }
              };

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-[var(--primary-50)] text-[var(--primary-600)] font-medium"
                      : "text-[var(--neutral-700)] hover:bg-[var(--neutral-100)] hover:text-[var(--primary-600)]"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <span className="text-sm">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

           {/* Logout button (visible for authenticated user) */}
            {user && (
              <div className="border-t p-3" style={{ borderColor: 'var(--neutral-200)' }}>
                {/* Show only icon when sidebar is collapsed; full button when expanded */}
                {collapsed ? (
                  <div className="w-full flex items-center justify-center">
                    <button
                      onClick={onSignOut}
                      title="Logout"
                      aria-label="Logout"
                      className="p-2 rounded-md hover:bg-[var(--neutral-100)] transition-colors duration-150"
                    >
                      <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onSignOut}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-100)] transition-colors duration-150"
                  >
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                )}
              </div>
            )}
        </div>
      </aside>


    </>
  );
}
