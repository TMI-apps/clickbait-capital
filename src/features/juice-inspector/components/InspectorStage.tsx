import type { ReactNode } from "react";
import { useJuiceAnchor } from "@/features/juice-engine/api";
import type { InspectorAnchorNames } from "@/features/juice-inspector/types/juiceInspector.types";
import { cn } from "@/shared/utils/cn";

interface AnchorProps {
  name: string;
  className?: string;
  children: ReactNode;
}

/** A labelled block registered as a juice anchor, so recipes can target it by name. */
const Anchor = ({ name, className, children }: AnchorProps) => {
  const ref = useJuiceAnchor(name);
  return (
    <div
      ref={ref}
      data-inspector-anchor={name}
      className={cn("relative min-w-0 rounded-lg border bg-card p-2 text-sm", className)}
    >
      {children}
    </div>
  );
};

const METER_LABELS: Record<string, string> = {
  "meter:users": "Gebruikers",
  "meter:revenue": "Geld",
  "meter:reputation": "Reputatie",
};

/**
 * A small mock of the board with every anchor the game's recipes target (board, meters, chart,
 * newest post, a card as the event origin, a button), so each recipe plays where it would in the
 * game. Labels show the anchor names that recipe steps use.
 */
export const InspectorStage = ({ anchors }: { anchors: InspectorAnchorNames }) => (
  <Anchor name={anchors.board} className="flex flex-col gap-2 bg-background p-3">
    <div className="grid grid-cols-3 gap-2">
      {anchors.meters.map((meter) => (
        <Anchor key={meter} name={meter}>
          <span className="block truncate font-semibold">{METER_LABELS[meter] ?? meter}</span>
          <span className="block truncate font-mono text-xs text-muted-foreground">{meter}</span>
        </Anchor>
      ))}
    </div>
    <Anchor name={anchors.chart} className="h-14">
      <span className="font-mono text-xs text-muted-foreground">chart</span>
    </Anchor>
    <Anchor name={anchors.feed} className="h-14">
      <span className="block font-semibold">Nieuwste post</span>
      <span className="font-mono text-xs text-muted-foreground">feed:newest</span>
    </Anchor>
    <div className="flex items-end justify-between gap-2">
      <Anchor name={anchors.card} className="h-20 w-16 text-center">
        <span className="block font-semibold">Kaart</span>
        <span className="font-mono text-[0.6rem] text-muted-foreground">origin</span>
      </Anchor>
      <Anchor name={anchors.button} className="px-4">
        <span className="font-semibold">Knop</span>
      </Anchor>
    </div>
  </Anchor>
);
