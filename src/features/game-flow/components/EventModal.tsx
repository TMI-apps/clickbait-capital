import { useId, useState } from "react";
import { Siren } from "lucide-react";
import { Button } from "@/components/common/Button";
import { GameCardArtwork } from "@/components/common/GameCard";
import { GlossaryText } from "@/components/common/GlossaryTerm";
import { Modal } from "@/components/common/Modal";
import { getCardImage } from "@/features/card-imagery/api";
import { GLOSSARY, UI_COPY } from "@/features/game-content/api";
import { EffectsJuice } from "@/features/game-juice/api";
import { useJuiceAnchor } from "@/features/juice-engine/api";
import type { FlowEvent } from "@/features/game-flow/types/gameFlow.types";

type EventOption = FlowEvent["options"][number];

/** Neutral marker by position, so it names the option without giving its effect away (event-redesign D1). */
const optionLetter = (index: number): string => String.fromCharCode(65 + index);

export interface EventModalProps {
  open: boolean;
  /** The event to show; kept by the caller while the modal animates closed. */
  event: FlowEvent | null;
  /** Called once the player has seen the outcome of the option and continues. */
  onChoose: (optionId: string) => void;
  /** Where focus goes once the modal has closed; the board returns it to the draft. */
  onCloseAutoFocus?: (event: Event) => void;
}

/**
 * The event's photo as a banner whose height follows the screen, so the whole dialog fits a
 * 360×640 phone without scrolling (event-redesign D4). Hidden from screen readers: the title and
 * body already tell the event (readable-hover D6).
 */
const EventPicture = ({ eventId }: { eventId: string }) => (
  <div aria-hidden="true" className="overflow-hidden rounded-md">
    <GameCardArtwork
      type="event"
      image={getCardImage(eventId) ?? undefined}
      className="aspect-auto h-[clamp(4rem,15dvh,8rem)]"
    />
  </div>
);

interface OptionListProps {
  options: EventOption[];
  onPick: (option: EventOption) => void;
}

/** The actions only: a letter and the label, never the meters they move (event-redesign D1). */
const OptionList = ({ options, onPick }: OptionListProps) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
      <Siren aria-hidden="true" className="size-4 text-destructive" />
      {UI_COPY.events.prompt}
    </legend>
    {options.map((option, index) => (
      <Button
        key={option.id}
        variant="choice"
        // Moves focus inside the open dialog when the next event replaces the options.
        autoFocus={index === 0}
        onClick={() => onPick(option)}
      >
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
        >
          {optionLetter(index)}
        </span>
        <span className="text-sm">{option.label}</span>
      </Button>
    ))}
  </fieldset>
);

interface OutcomeProps {
  option: EventOption;
  onContinue: () => void;
}

/**
 * What the choice did: the action and its meter changes, then "Verder" (event-redesign D2).
 * The changes play the card juice of the option's kind (event-juice-drop D1–D2). "Verder"
 * takes focus and is described by the outcome, so a screen reader hears it (D3).
 */
const Outcome = ({ option, onContinue }: OutcomeProps) => {
  const outcomeId = useId();
  return (
    <div className="flex flex-col gap-3 duration-(--duration-normal) motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2">
      <div id={outcomeId} className="flex flex-col gap-2 rounded-md border bg-card p-3">
        <p className="text-sm">
          <span className="block text-xs font-semibold text-muted-foreground">
            {UI_COPY.events.outcomeKicker}
            <span className="sr-only">: </span>
          </span>
          <span className="font-medium">{option.label}</span>
        </p>
        {option.effects.length > 0 && <EffectsJuice effects={option.effects} kind={option.kind} />}
      </div>
      <Button autoFocus aria-describedby={outcomeId} onClick={onContinue}>
        {UI_COPY.events.continueButton}
      </Button>
    </div>
  );
};

/** One event's answer: the options, then the outcome of the picked one. */
const EventAnswer = ({ event, onChoose }: { event: FlowEvent; onChoose: (id: string) => void }) => {
  const [picked, setPicked] = useState<EventOption | null>(null);
  if (!picked) return <OptionList options={event.options} onPick={setPicked} />;
  return <Outcome option={picked} onContinue={() => onChoose(picked.id)} />;
};

/**
 * An event interrupts the draft: one urgent situation and three actions whose effects stay a
 * surprise until the player picks one. It must be answered (no close button, Escape and overlay
 * ignored); the choice reaches the engine when the player continues past the outcome.
 */
export const EventModal = ({ open, event, onChoose, onCloseAutoFocus }: EventModalProps) => {
  // `event.appeared` / `scandal.hit` glow around the dialog as it arrives.
  const anchor = useJuiceAnchor("event-dialog");
  return (
    <Modal
      contentRef={anchor}
      onCloseAutoFocus={onCloseAutoFocus}
      open={open}
      dismissible={false}
      className="gap-3 p-4"
      title={event ? `${UI_COPY.events.kicker}: ${event.title}` : undefined}
      media={event && <EventPicture key={event.id} eventId={event.id} />}
      description={event && <GlossaryText text={event.body} glossary={GLOSSARY} />}
    >
      {/* Keyed by event: events reuse option ids, so the next event gets fresh buttons and a
          fresh outcome state, and its first option takes focus (readable-hover D3). Answering
          has its own juice (outcome, `event.choice`), not the press tap. */}
      {event && (
        <div data-juice-press="off">
          <EventAnswer key={event.id} event={event} onChoose={onChoose} />
        </div>
      )}
    </Modal>
  );
};
