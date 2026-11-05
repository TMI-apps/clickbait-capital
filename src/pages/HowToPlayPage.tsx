import { Link } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { UI_COPY } from "@/features/game-content/api";
import { appScrollContentClassName, formContentWidthClassName } from "@/shared/theme/appViewLayout";
import { cn } from "@/shared/utils/cn";

const COPY = UI_COPY.howToPlay;

const SECTIONS = [
  { title: COPY.phasesTitle, body: COPY.phases },
  { title: COPY.eventsTitle, body: COPY.events },
  { title: COPY.winTitle, body: COPY.win },
];

/** `/hoe-speel-je`: the short rules (DOC_GAME_DESIGN), reached from the start screen. */
export const HowToPlayPage = () => (
  <div className={appScrollContentClassName}>
    <article className={cn(formContentWidthClassName, "flex flex-col gap-5")}>
      <h1 className="font-heading text-3xl font-bold">{COPY.title}</h1>
      <p>{COPY.intro}</p>
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        {UI_COPY.tutorial.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>
      {SECTIONS.map((section) => (
        <section key={section.title} className="flex flex-col gap-1">
          <h2 className="font-heading text-xl font-bold">{section.title}</h2>
          <p className="text-muted-foreground">{section.body}</p>
        </section>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button size="lg" asChild>
          <Link to="/spel">{COPY.startButton}</Link>
        </Button>
        <Button variant="ghost" size="lg" asChild>
          <Link to="/">{COPY.backButton}</Link>
        </Button>
      </div>
    </article>
  </div>
);
