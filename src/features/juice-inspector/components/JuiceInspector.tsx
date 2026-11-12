import type { JuiceRecipe } from "@/features/juice-engine/api";
import { EventLog } from "@/features/juice-inspector/components/EventLog";
import { EventPad } from "@/features/juice-inspector/components/EventPad";
import { InspectorStage } from "@/features/juice-inspector/components/InspectorStage";
import { StepEditor, type StepBranch } from "@/features/juice-inspector/components/StepEditor";
import { TuningPanel } from "@/features/juice-inspector/components/TuningPanel";
import { useJuiceInspector } from "@/features/juice-inspector/hooks/useJuiceInspector";

/** The shared steps (if any) and the selected variant's steps. */
function branchesOf(recipe: JuiceRecipe | undefined, variant: string | null): StepBranch[] {
  if (!recipe) return [];
  const branches: StepBranch[] = [];
  if (recipe.steps?.length || !variant)
    branches.push({ branch: "steps", steps: recipe.steps ?? [] });
  if (variant) branches.push({ branch: variant, steps: recipe.variants?.[variant] ?? [] });
  return branches;
}

/**
 * The juice inspector (`/juice`, hidden dev tool, juice-core D6): trigger any juice event on a
 * mock board through the game's real director, tune global knobs and every step value live, read
 * the event log, and copy the overrides as JSON. Overrides persist and apply in `/spel` too.
 */
export const JuiceInspector = () => {
  const { store, view, entries, effects, anchors, selected, trigger, log } = useJuiceInspector();
  const recipe = selected ? view.book[selected.event] : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:items-start lg:gap-8">
      <div className="sticky top-0 z-10 flex flex-col gap-2 bg-background pt-2 pb-3 lg:top-4">
        <h1 className="font-heading text-2xl font-bold">Juice-inspector</h1>
        <p className="text-sm text-muted-foreground">
          Speel elk event af, stel waarden bij en kopieer de JSON voor de recepten.
        </p>
        <InspectorStage anchors={anchors} />
      </div>
      <div className="flex flex-col gap-6">
        <EventPad entries={entries} selected={selected} onTrigger={trigger} />
        {selected && (
          <StepEditor
            title={selected.label}
            branches={branchesOf(recipe, selected.variant)}
            effects={effects}
            onChange={({ branch, index }, param, value) =>
              store.setStepValue({ event: selected.event, branch, index }, param, value)
            }
          />
        )}
        <TuningPanel tuning={view.tuning} store={store} />
        <EventLog entries={log} />
      </div>
    </div>
  );
};
