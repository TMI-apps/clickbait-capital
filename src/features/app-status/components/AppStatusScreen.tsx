import { CloudOff, TriangleAlert, MonitorX } from "lucide-react";
import { Button } from "@/components/common/Button";
import { UI_COPY } from "@/features/game-content/api/copy";
import { useAppStatusActions } from "@/features/app-status/hooks/useAppStatusActions";

const COPY = UI_COPY.appStatus;

export type AppStatusKind = "offline" | "loadFailed" | "unsupported";

const SCREENS = {
  offline: { Icon: CloudOff, title: COPY.offlineTitle, body: COPY.offlineBody, retry: true },
  loadFailed: {
    Icon: TriangleAlert,
    title: COPY.loadFailedTitle,
    body: COPY.loadFailedBody,
    retry: true,
  },
  unsupported: {
    Icon: MonitorX,
    title: COPY.unsupportedTitle,
    body: `${COPY.unsupportedBody} ${COPY.browserTip}`,
    retry: false,
  },
} as const;

export interface AppStatusScreenProps {
  kind: AppStatusKind;
}

/**
 * Full-screen state when the app cannot show a page: offline, failed to load, or an
 * unsupported browser. Retry reloads; home is a hard navigation to the start screen.
 */
export const AppStatusScreen = ({ kind }: AppStatusScreenProps) => {
  const { Icon, title, body, retry } = SCREENS[kind];
  const actions = useAppStatusActions();
  return (
    <main
      role="alert"
      className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <Icon aria-hidden="true" className="size-12 text-primary" />
      <h1 className="font-heading text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{body}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {retry && (
          <Button className="min-h-11" onClick={actions.retry}>
            {COPY.retryButton}
          </Button>
        )}
        <Button
          variant={retry ? "outline" : "default"}
          className="min-h-11"
          onClick={actions.goHome}
        >
          {COPY.homeButton}
        </Button>
      </div>
    </main>
  );
};
