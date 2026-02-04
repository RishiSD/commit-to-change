"use client";

import { CopilotKit } from "@copilotkit/react-core";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Sidebar } from "@/components/Sidebar";
import { useState, useLayoutEffect, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Inter } from "next/font/google";
import type { Session, User } from "@supabase/supabase-js";

// Configure Inter font
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-inter',
  display: 'swap',
});

/**
 * Inner layout component that uses CopilotKit context
 * Must be rendered inside <CopilotKit> provider
 */
function LayoutContent({
  children,
  user,
  session,
  signOut,
  getAccessToken,
}: {
  children: React.ReactNode;
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  getAccessToken: () => string | null;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initial collapse state: auto-collapse on small screens
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 1024) setSidebarCollapsed(true);
  }, []);

  return (
    <div className="flex w-full h-screen overflow-x-hidden">
      {/* Sidebar (pushes content on desktop, overlays on mobile) */}
      {session && user && (
        <Sidebar 
          user={user} 
          onSignOut={signOut} 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed}
        />
      )}
      
      {/* Main content area (flex-grow). On large screens add left padding that equals the
          sidebar width so the fixed sidebar doesn't overlap or push content offscreen. */}
      <main className={`flex-grow min-w-0 h-full overflow-y-auto overflow-x-hidden transition-all duration-300 ${session ? (sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64') : ''}`}>
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, session, isLoading, signOut, getAccessToken } = useSupabaseAuth();
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting - hydration detection pattern
  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state while checking authentication
  if (!mounted || isLoading) {
    return (
      <html lang="en" className={inter.variable}>
        <body className={`${inter.className} antialiased`}>
          <div className="flex items-center justify-center h-screen">
            <p>Loading...</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <CopilotKit 
          runtimeUrl="/api/copilotkit" 
          agent="sample_agent" 
          showDevConsole={false}
          // Pass Supabase access token to CopilotKit
          properties={session ? { authorization: `Bearer ${getAccessToken()}` } : undefined}
        >
          <LayoutContent
            user={user}
            session={session}
            signOut={signOut}
            getAccessToken={getAccessToken}
          >
            {children}
          </LayoutContent>
           
          {/* Toast notifications - Updated to terracotta theme */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#292524',
                border: '2px solid #f38b72',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                iconTheme: {
                  primary: '#e86d4f',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </CopilotKit>
      </body>
    </html>
  );
}
