"use client";

import { CopilotKit } from "@copilotkit/react-core";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { UserMenu } from "@/components/auth/UserMenu";
import { useEffect, useState } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, session, isLoading, signOut, getAccessToken } = useSupabaseAuth();
  const [mounted, setMounted] = useState(false);
  const themeColor = "#9333ea"; // Purple theme color for Aura Chef

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state while checking authentication
  if (!mounted || isLoading) {
    return (
      <html lang="en">
        <body className="antialiased">
          <div className="flex items-center justify-center h-screen">
            <p>Loading...</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="antialiased">
        <CopilotKit 
          runtimeUrl="/api/copilotkit" 
          agent="sample_agent" 
          showDevConsole={false}
          // Pass Supabase access token to CopilotKit
          properties={session ? { authorization: `Bearer ${getAccessToken()}` } : undefined}
        >
          {/* Show user menu if authenticated */}
          {session && user && <UserMenu user={user} onSignOut={signOut} themeColor={themeColor} />}
          
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
