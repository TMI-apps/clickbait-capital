/**
 * Public API of the app-status feature: app-level offline, failed-to-load and
 * unsupported-browser states. Mounted once in `App.tsx`.
 */
export { AppErrorFallback } from "@/features/app-status/components/AppErrorFallback";
export { AppStatusScreen } from "@/features/app-status/components/AppStatusScreen";
export type { AppStatusKind } from "@/features/app-status/components/AppStatusScreen";
export { BrowserSupportGate } from "@/features/app-status/components/BrowserSupportGate";
export { OfflineBanner } from "@/features/app-status/components/OfflineBanner";
