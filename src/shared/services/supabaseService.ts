import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase types for the rest of the app (this file is the only @supabase import site).
 * Type-only: the library itself is loaded on demand by `loadSupabase()`, so it stays out of the
 * main chunk and visitors who never touch sign-in never download it.
 */
export type { AuthError, User as SupabaseUser } from "@supabase/supabase-js";
export type SupabaseAuth = SupabaseClient["auth"];
export type { SupabaseClient };

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Support both publishable key (new) and anon key (legacy) for backward compatibility
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Placeholder values (test bypass + `.env.example`) that mean "not configured". */
const PLACEHOLDER_VALUES = new Set([
  "https://test-local.supabase.co",
  "test-anon-key-for-local-testing",
  "your-project-url",
  "your-anon-key",
  "your-publishable-key",
]);

/** supabase-js stores the session (and the PKCE verifier) under `sb-<project-ref>-auth-token*`. */
const PERSISTED_SESSION_KEY = /^sb-.+-auth-token/;

let clientPromise: Promise<SupabaseClient> | null = null;
const loadedListeners = new Set<(client: SupabaseClient) => void>();
let loadedClient: SupabaseClient | null = null;

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = (): boolean =>
  Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !PLACEHOLDER_VALUES.has(supabaseUrl) &&
    !PLACEHOLDER_VALUES.has(supabaseAnonKey)
  );

/**
 * True when this browser holds a stored Supabase session or a pending PKCE verifier, read without
 * loading the library. Lets the app skip loading auth for visitors who never signed in.
 */
export const hasPersistedAuthSession = (): boolean => {
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && PERSISTED_SESSION_KEY.test(key)) {
        return true;
      }
    }
  } catch {
    // Storage blocked: no stored session to restore.
  }
  return false;
};

const createSupabaseClient = async (url: string, key: string): Promise<SupabaseClient> => {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Use PKCE flow for better security and CORS compatibility
      flowType: "pkce",
    },
  });
  loadedClient = client;
  loadedListeners.forEach((listener) => listener(client));
  return client;
};

/**
 * Loads supabase-js and returns the one shared client, created on first call (rejects if not
 * configured). Every Supabase call goes through here, so the library downloads only when needed.
 */
export const loadSupabase = (): Promise<SupabaseClient> => {
  if (!isSupabaseConfigured() || !supabaseUrl || !supabaseAnonKey) {
    return Promise.reject(
      new Error(
        "Supabase is not configured. Authentication requires Supabase environment variables."
      )
    );
  }
  clientPromise ??= createSupabaseClient(supabaseUrl, supabaseAnonKey).catch((error: unknown) => {
    clientPromise = null; // a failed chunk download (offline) may succeed on the next call
    throw error;
  });
  return clientPromise;
};

/**
 * Calls `listener` with the client once something has loaded it (immediately if it already is).
 * Lets long-lived subscriptions attach without being the reason the library loads.
 * Returns an unsubscribe function.
 */
export const onSupabaseLoaded = (listener: (client: SupabaseClient) => void): (() => void) => {
  if (loadedClient) {
    listener(loadedClient);
    return () => undefined;
  }
  loadedListeners.add(listener);
  return () => {
    loadedListeners.delete(listener);
  };
};
