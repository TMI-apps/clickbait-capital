import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { UI_COPY } from "@/features/game-content/api";
import { SettingsPanel } from "@/features/game-settings/api";
import { appScrollContentClassName, formContentWidthClassName } from "@/shared/theme/appViewLayout";
import { cn } from "@/shared/utils/cn";

/** `/instellingen`: the settings panel as a page, reached from the start screen. */
export const SettingsPage = () => (
  <div className={appScrollContentClassName}>
    <div className={cn(formContentWidthClassName, "flex flex-col gap-6")}>
      <h1 className="font-heading text-3xl font-bold">{UI_COPY.settings.title}</h1>
      <SettingsPanel />
      <Button variant="ghost" className="min-h-11 self-start" asChild>
        <Link to="/">{UI_COPY.howToPlay.backButton}</Link>
      </Button>
    </div>
  </div>
);
