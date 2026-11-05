import type { ReactNode } from "react";
import { AppStatusScreen } from "@/features/app-status/components/AppStatusScreen";
import { useBrowserSupported } from "@/features/app-status/hooks/useAppStatusActions";

/** Renders the app, or "Browser niet ondersteund" when a required platform feature is missing. */
export const BrowserSupportGate = ({ children }: { children: ReactNode }) =>
  useBrowserSupported() ? children : <AppStatusScreen kind="unsupported" />;
