import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const loadService = async () => {
  vi.resetModules();
  return import("./supabaseService");
};

describe("supabaseService", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should report a persisted session when supabase-js stored an auth token", async () => {
    const { hasPersistedAuthSession } = await loadService();
    window.localStorage.setItem("sb-abcdefgh-auth-token", JSON.stringify({ access_token: "x" }));
    expect(hasPersistedAuthSession()).toBe(true);
  });

  it("should report a persisted session when a PKCE verifier is pending", async () => {
    const { hasPersistedAuthSession } = await loadService();
    window.localStorage.setItem("sb-abcdefgh-auth-token-code-verifier", JSON.stringify("v"));
    expect(hasPersistedAuthSession()).toBe(true);
  });

  it("should report no persisted session when only other app keys are stored", async () => {
    const { hasPersistedAuthSession } = await loadService();
    window.localStorage.setItem("color-mode", "dark");
    expect(hasPersistedAuthSession()).toBe(false);
  });

  it("should reject loadSupabase when Supabase is not configured", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "your-project-url");
    const { loadSupabase } = await loadService();
    await expect(loadSupabase()).rejects.toThrow("Supabase is not configured");
  });

  it("should hand the client to waiting listeners when something loads it", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://abcdefgh.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_testkey");
    const { loadSupabase, onSupabaseLoaded } = await loadService();
    const listener = vi.fn();
    onSupabaseLoaded(listener);
    expect(listener).not.toHaveBeenCalled();

    const client = await loadSupabase();

    expect(listener).toHaveBeenCalledWith(client);
    expect(await loadSupabase()).toBe(client);
  });
});
