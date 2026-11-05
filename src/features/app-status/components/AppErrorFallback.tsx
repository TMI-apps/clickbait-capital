import { AppStatusScreen } from "@/features/app-status/components/AppStatusScreen";
import { useOnlineStatus } from "@/features/app-status/hooks/useOnlineStatus";

/** Error-boundary fallback: a page that failed while offline says so; otherwise "Laden mislukt". */
export const AppErrorFallback = () => {
  const online = useOnlineStatus();
  return <AppStatusScreen kind={online ? "loadFailed" : "offline"} />;
};
