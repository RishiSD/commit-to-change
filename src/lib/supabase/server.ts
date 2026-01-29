/**
 * Supabase client for server-side operations.
 * 
 * This client is used in Next.js API routes and server components to interact
 * with Supabase with elevated permissions (service role key).
 * 
 * ⚠️ WARNING: Only use this in server-side code (API routes, server components).
 * Never import or use this in client components, as it would expose the service key!
 * 
 * Usage:
 *   import { supabaseAdmin } from '@/lib/supabase/server';
 *   const { data, error } = await supabaseAdmin.auth.admin.listUsers();
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Please add it to your .env.local file.'
  );
}

if (!supabaseServiceKey) {
  console.warn(
    'Missing SUPABASE_SERVICE_KEY environment variable. ' +
    'Admin operations will not be available. ' +
    'This is normal for client-side only usage.'
  );
}

/**
 * Admin client with service role key for server-side operations.
 * Has full access to the database, bypassing RLS policies.
 */
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Create a Supabase client for server-side with user's session.
 * This respects RLS policies based on the user's JWT token.
 * 
 * Usage in API routes:
 *   const supabase = createServerSupabaseClient(accessToken);
 *   const { data } = await supabase.from('user_saved_recipes').select('*');
 */
export function createServerSupabaseClient(accessToken: string) {
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL environment variable');
  }
  
  // Use anon key but with user's access token
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
