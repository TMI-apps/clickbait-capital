import { useEffect } from "react";
import { isSupabaseConfigured, onSupabaseLoaded } from "@/shared/services/supabaseService";
import { handleAuthStateChange } from "./useAuthSession";
import { cleanOAuthRedirectFromUrl } from "@/shared/utils/oauthUtils";
import type { User } from "@/features/auth/types/auth.types";

interface UseAuthStateSubscriptionOptions {
  onUserChange: (user: User | null) => void;
  onLoadingChange: (loading: boolean) => void;
}

export const useAuthStateSubscription = ({
  onUserChange,
  onLoadingChange,
}: UseAuthStateSubscriptionOptions) => {
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    // Attaches once something loads the client (a stored session, a sign-in action); does not
    // load supabase-js by itself, so visitors who never sign in never download it.
    let unsubscribeAuth: (() => void) | undefined;
    const stopWaiting = onSupabaseLoaded((supabase) => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        cleanOAuthRedirectFromUrl();
        const { user: stateUser } = await handleAuthStateChange(session);
        onUserChange(stateUser);
        onLoadingChange(false);
      });
      unsubscribeAuth = () => subscription.unsubscribe();
    });

    return () => {
      stopWaiting();
      unsubscribeAuth?.();
    };
  }, [onUserChange, onLoadingChange]);
};
