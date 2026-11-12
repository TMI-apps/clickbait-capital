import type { ReactElement, ReactNode } from "react";
import { render, renderHook, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import type { AuthContextValue } from "@/features/auth/types/auth.types";
import type { JuiceEffectContext, JuiceResolvedTarget } from "@/features/juice-engine/api";
import { ColorModeProvider } from "@/shared/context/ColorModeContext";

/**
 * Creates a QueryClient for tests with retry disabled.
 * Use this instead of the app's createQueryClient to avoid flaky tests from retries.
 */
export const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: 0,
      },
    },
  });

/**
 * Wraps children with QueryClientProvider for tests.
 *
 * @example
 * render(createQueryClientWrapper()(<ProfileMenu />));
 */
export const createQueryClientWrapper = (options?: { queryClient?: QueryClient }) => {
  const queryClient = options?.queryClient ?? createTestQueryClient();

  return function QueryClientWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

export interface ProviderRenderOptions extends Omit<RenderOptions, "wrapper"> {
  withRouter?: boolean;
  withQueryClient?: boolean;
  initialEntries?: string[];
  queryClient?: QueryClient;
}

function AllProviders({
  children,
  options,
}: {
  children: ReactNode;
  options: ProviderRenderOptions;
}) {
  const { withRouter = true, withQueryClient = true, initialEntries, queryClient } = options;

  let tree: ReactNode = <ColorModeProvider>{children}</ColorModeProvider>;

  if (withQueryClient) {
    const client = queryClient ?? createTestQueryClient();
    tree = <QueryClientProvider client={client}>{tree}</QueryClientProvider>;
  }

  if (withRouter) {
    tree = initialEntries ? (
      <MemoryRouter initialEntries={initialEntries}>{tree}</MemoryRouter>
    ) : (
      <BrowserRouter>{tree}</BrowserRouter>
    );
  }

  return <>{tree}</>;
}

/**
 * Renders a component with Router and QueryClient wrappers (both on by default).
 *
 * @example
 * renderWithProviders(<ProfileMenu />);
 *
 * @example
 * renderWithProviders(<Dashboard />, { initialEntries: ["/dashboard"] });
 */
export function renderWithProviders(ui: ReactElement, options: ProviderRenderOptions = {}) {
  const { withRouter, withQueryClient, initialEntries, queryClient, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders options={{ withRouter, withQueryClient, initialEntries, queryClient }}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
}

/**
 * Renders a hook with Router and QueryClient wrappers (both on by default).
 *
 * @example
 * const { result } = renderHookWithProviders(() => useAuthRedirect());
 */
export function renderHookWithProviders<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: ProviderRenderOptions & { initialProps?: TProps } = {}
) {
  const { initialProps, withRouter, withQueryClient, initialEntries, queryClient } = options;

  return renderHook(hook, {
    initialProps,
    wrapper: ({ children }) => (
      <AllProviders options={{ withRouter, withQueryClient, initialEntries, queryClient }}>
        {children}
      </AllProviders>
    ),
  });
}

/**
 * Default AuthContext mock shape for component tests that mock useAuthContext.
 */
export function createDefaultAuthContextValue(
  overrides: Partial<AuthContextValue> = {}
): AuthContextValue {
  return {
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    signUp: vi.fn(),
    logout: vi.fn(),
    signInWithGoogle: vi.fn(),
    requestPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
    clearAuthError: vi.fn(),
    setAuthError: vi.fn(),
    ...overrides,
  };
}

/** Controls the `prefers-color-scheme` result of the window.matchMedia test double. */
export interface MatchMediaController {
  setPrefersDark: (prefersDark: boolean) => void;
  /** Number of active `(prefers-color-scheme: dark)` change listeners. */
  listenerCount: () => number;
}

/**
 * Installs a window.matchMedia test double (jsdom has none). `(prefers-color-scheme: dark)`
 * follows `prefersDark` and notifies "change" listeners; other queries never match.
 * tests/setup.ts installs it with light before every test.
 */
export function installMatchMediaMock(prefersDark = false): MatchMediaController {
  let dark = prefersDark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const isDarkQuery = (query: string) => query.includes("prefers-color-scheme: dark");

  window.matchMedia = (query: string) =>
    ({
      media: query,
      get matches() {
        return isDarkQuery(query) && dark;
      },
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        if (isDarkQuery(query)) listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;

  return {
    setPrefersDark: (next) => {
      dark = next;
      listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent));
    },
    listenerCount: () => listeners.size,
  };
}

/** One animation the Web Animations stub started, with what it was asked to play. */
export interface StubAnimation {
  element: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
  animation: Animation;
}

export interface AnimateStubController {
  calls: StubAnimation[];
  /** Runs every started animation's `onfinish` (as if they all played to the end). */
  finishAll: () => void;
  restore: () => void;
}

/**
 * Installs `Element.prototype.animate` (jsdom has no Web Animations): every call is recorded
 * and returns a fake running animation; nothing finishes until `finishAll`.
 */
export function installAnimateStub(): AnimateStubController {
  const original = Element.prototype.animate;
  const calls: StubAnimation[] = [];
  Element.prototype.animate = function animate(
    this: Element,
    keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions
  ): Animation {
    const animation = {
      playState: "running",
      playbackRate: 1,
      onfinish: null,
      cancel: vi.fn(function cancel(this: { playState: string }) {
        this.playState = "idle";
      }),
      updatePlaybackRate: vi.fn(function update(this: { playbackRate: number }, rate: number) {
        this.playbackRate = rate;
      }),
    } as unknown as Animation;
    calls.push({
      element: this,
      keyframes: (keyframes ?? []) as Keyframe[],
      options: typeof options === "object" ? options : {},
      animation,
    });
    return animation;
  };
  return {
    calls,
    finishAll: () =>
      calls.forEach(({ animation }) => {
        const done = animation.onfinish as ((event: AnimationPlaybackEvent) => void) | null;
        (animation as { playState: string }).playState = "finished";
        done?.({} as AnimationPlaybackEvent);
      }),
    restore: () => {
      Element.prototype.animate = original;
    },
  };
}

/**
 * A juice effect context for unit tests: a stage in the document, anchors by name, intensity 1
 * and a fixed random value; override any field.
 */
export function createJuiceTestContext(
  options: {
    anchors?: Record<string, Element>;
    overrides?: Partial<JuiceEffectContext>;
  } = {}
): JuiceEffectContext & { stage: HTMLElement } {
  const stage = document.createElement("div");
  document.body.appendChild(stage);
  const tracked: Animation[] = [];
  const resolve = (ref: string): JuiceResolvedTarget | null => {
    if (ref === "screen")
      return { element: null, rect: { x: 0, y: 0, width: 390, height: 844 }, isScreen: true };
    const element = options.anchors?.[ref];
    return element
      ? { element, rect: { x: 10, y: 20, width: 100, height: 40 }, isScreen: false }
      : null;
  };
  return {
    resolve,
    stage,
    intensity: 1,
    motionScale: 1,
    volume: 1,
    reduced: false,
    random: () => 0.5,
    fill: (template) => template,
    track: (animation) => tracked.push(animation),
    animations: () => tracked.filter((animation) => animation.playState === "running"),
    ...options.overrides,
  } as JuiceEffectContext & { stage: HTMLElement };
}
