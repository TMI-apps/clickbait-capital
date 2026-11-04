import { useId, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type {
  GameCardAnimation,
  GameCardEffect,
  GameCardImage,
  GameCardRarity,
  GameCardSize,
  GameCardType,
} from "./gameCard.types";
import { GameCardArtwork } from "./GameCardArtwork";
import { GameCardEffects } from "./GameCardEffects";
import { GAME_CARD_RARITIES, GAME_CARD_TYPES, gameCardVariants } from "./gameCardVariants";

export interface GameCardProps {
  type: GameCardType;
  title: string;
  image?: GameCardImage;
  effects?: GameCardEffect[];
  flavor?: string;
  rarity?: GameCardRarity;
  /** `compact` for three-in-a-row on phones; default is the full card. */
  size?: GameCardSize;
  /** Overrides the default Dutch type label (e.g. "Breaking"). The type icon stays. */
  typeLabel?: string;
  selected?: boolean;
  disabled?: boolean;
  /** Makes the card a button (Enter / Space / click). Without it the card is static. */
  onSelect?: () => void;
  animation?: GameCardAnimation;
  className?: string;
}

interface TypeChipProps {
  type: GameCardType;
  label: string;
  /** Shown instead of `label` on compact cards; `label` stays the accessible name. */
  shortLabel?: string;
  id: string;
}

const TypeChip = ({ type, label, shortLabel, id }: TypeChipProps) => {
  const { icon: Icon, chip } = GAME_CARD_TYPES[type];
  return (
    <span
      id={id}
      className={cn(
        "inline-flex items-center gap-1 rounded-full py-0.5 text-xs font-bold tracking-wide uppercase",
        shortLabel ? "px-1.5" : "px-2",
        chip
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {shortLabel ? (
        <>
          <span aria-hidden="true">{shortLabel}</span>
          <span className="sr-only">{label}</span>
        </>
      ) : (
        label
      )}
    </span>
  );
};

const RarityBadge = ({ rarity }: { rarity: GameCardRarity }) => {
  if (rarity === "common") return null;
  const { icon: Icon, label } = GAME_CARD_RARITIES[rarity];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-popover px-2 py-0.5 text-xs font-semibold text-popover-foreground">
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </span>
  );
};

const SelectedBadge = () => (
  <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground elevation-md">
    <Check aria-hidden="true" className="size-3.5" />
    Gekozen
  </span>
);

interface CardBodyProps extends GameCardProps {
  ids: { title: string; type: string; details: string };
}

/** Lower half: title, effects and (not on compact cards) the flavor text. */
const CardText = ({ ids, compact, ...card }: CardBodyProps & { compact: boolean }) => (
  <span className={cn("flex flex-1 flex-col", compact ? "gap-1.5 p-2" : "gap-2 p-3")}>
    <span
      id={ids.title}
      className={cn(
        "line-clamp-2 font-heading leading-tight font-bold",
        compact ? "text-sm hyphens-auto break-words" : "text-base"
      )}
    >
      {card.title}
    </span>
    <span id={ids.details} className="flex flex-col gap-2">
      {card.effects && card.effects.length > 0 && (
        <GameCardEffects effects={card.effects} compact={compact} />
      )}
      {card.flavor && !compact && (
        <span className="line-clamp-3 text-xs text-muted-foreground italic">{card.flavor}</span>
      )}
    </span>
  </span>
);

const CardBody = (props: CardBodyProps): ReactNode => {
  const { ids, ...card } = props;
  const compact = card.size === "compact";
  const { label, shortLabel } = GAME_CARD_TYPES[card.type];
  return (
    <>
      <span className="relative block">
        <GameCardArtwork type={card.type} image={card.image} />
        <span className="absolute inset-x-2 top-2 flex flex-wrap items-start gap-1">
          <TypeChip
            type={card.type}
            label={card.typeLabel ?? label}
            shortLabel={compact && !card.typeLabel ? shortLabel : undefined}
            id={ids.type}
          />
          <RarityBadge rarity={card.rarity ?? "common"} />
        </span>
        {card.selected && <SelectedBadge />}
      </span>
      <CardText {...props} compact={compact} />
    </>
  );
};

/**
 * Generic playing card for the game board (kit component: presentation only). Type and
 * rarity set the frame; meter effects, flavor text and image come in as data. With
 * `onSelect` it is one keyboard-operable button (`aria-pressed` = selected).
 */
export const GameCard = (props: GameCardProps) => {
  const uid = useId();
  const ids = { title: `${uid}-title`, type: `${uid}-type`, details: `${uid}-details` };
  const interactive = props.onSelect !== undefined;
  const className = cn(
    gameCardVariants({
      type: props.type,
      rarity: props.rarity,
      size: props.size ?? "default",
      interactive,
      selected: props.selected ?? false,
      disabled: props.disabled ?? false,
      animation: props.animation ?? "none",
    }),
    props.className
  );
  const dataAttrs = { "data-slot": "game-card", "data-type": props.type };

  if (!interactive) {
    return (
      <article aria-labelledby={ids.title} className={className} {...dataAttrs}>
        <CardBody {...props} ids={ids} />
      </article>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={props.selected ?? false}
      aria-labelledby={`${ids.title} ${ids.type}`}
      aria-describedby={ids.details}
      disabled={props.disabled}
      onClick={props.onSelect}
      className={className}
      {...dataAttrs}
    >
      <CardBody {...props} ids={ids} />
    </button>
  );
};
