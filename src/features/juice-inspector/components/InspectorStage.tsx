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

/** The anchor name under a block's label, so recipe targets are easy to read off. */
const AnchorName = ({ children }: { children: ReactNode }) => (
  <span className="block truncate font-mono text-xs text-muted-foreground">{children}</span>
);

/** The phase intro's current step dot (`phase:step`), inside the goal box. */
const StepDot = ({ name }: { name: string }) => {
  const ref = useJuiceAnchor(name);
  return <span ref={ref} aria-hidden="true" className="block h-1.5 w-8 rounded-full bg-primary" />;
};

const COUNTER_LABELS: Record<string, string> = {
  "meter:users": "Gebruikers",
  "meter:revenue": "Geld",
};

/**
 * A small mock of the board with every anchor the game's recipes target, laid out like the
 * real one: the score chart with its two counters and the scandal warning, an event outcome's
 * rows, the drop slot, the newest post with a comment, a card (the event origin), a button,
 * the event dialog, the phase intro's step dot and goal, and the ending icon, all inside the end
 * screen
 * anchor. Labels show the anchor names that recipe steps use.
 */
export const InspectorStage = ({ anchors }: { anchors: InspectorAnchorNames }) => (
  <Anchor name={anchors.endScreen} className="border-0 bg-transparent p-0">
    <Anchor name={anchors.board} className="flex flex-col gap-2 bg-background p-3">
      <Anchor name={anchors.chart} className="flex h-24 flex-col justify-between">
        <div className="grid grid-cols-2 gap-2">
          {anchors.meters.map((meter, index) => (
            <Anchor key={meter} name={meter} className={cn("py-1", index > 0 && "text-right")}>
              <span className="block truncate font-semibold">{COUNTER_LABELS[meter] ?? meter}</span>
              <AnchorName>{meter}</AnchorName>
            </Anchor>
          ))}
        </div>
        <AnchorName>chart</AnchorName>
      </Anchor>
      <Anchor name={anchors.scandal} className="py-1">
        <span className="font-semibold">Schandaal dreigt</span> <AnchorName>scandal</AnchorName>
      </Anchor>
      <div className="grid grid-cols-2 gap-2">
        {anchors.outcomes.map((row) => (
          <Anchor key={row} name={row} className="h-9 py-1">
            <AnchorName>{row}</AnchorName>
          </Anchor>
        ))}
      </div>
      <Anchor name={anchors.drop} className="border-2 border-dashed border-primary/60 py-1">
        <span className="font-semibold">Laat los om te plaatsen</span>{" "}
        <AnchorName>{anchors.drop}</AnchorName>
      </Anchor>
      <Anchor name={anchors.feed} className="flex flex-col gap-1">
        <span className="block font-semibold">Nieuwste post</span>
        <AnchorName>{anchors.feed}</AnchorName>
        <Anchor name={anchors.comment} className="py-0.5 text-xs">
          <span className="font-semibold">Volger:</span> wauw!{" "}
          <AnchorName>{anchors.comment}</AnchorName>
        </Anchor>
      </Anchor>
      <div className="flex items-end justify-between gap-2">
        <Anchor name={anchors.card} className="h-20 w-16 text-center">
          <span className="block font-semibold">Kaart</span>
          <AnchorName>origin</AnchorName>
        </Anchor>
        <Anchor name={anchors.button} className="px-4">
          <span className="font-semibold">Knop</span>
        </Anchor>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Anchor name={anchors.eventDialog} className="py-1">
          <span className="block font-semibold">Dialoog</span>
          <AnchorName>{anchors.eventDialog}</AnchorName>
        </Anchor>
        <Anchor name={anchors.phaseGoal} className="flex flex-col gap-1 py-1">
          <StepDot name={anchors.phaseStep} />
          <AnchorName>{anchors.phaseGoal}</AnchorName>
        </Anchor>
        <Anchor name={anchors.endingIcon} className="py-1 text-center">
          <span className="block font-semibold">🔔</span>
          <AnchorName>{anchors.endingIcon}</AnchorName>
        </Anchor>
      </div>
    </Anchor>
  </Anchor>
);
