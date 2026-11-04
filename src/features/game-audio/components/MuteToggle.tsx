import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/common/Button/Button";
import { useSoundEffects } from "@/features/game-audio/hooks/useSoundEffects";

export interface MuteToggleProps {
  className?: string;
  /** Icon-only 44 px square (outline), for tight toolbars such as the board header. */
  compact?: boolean;
}

/**
 * Sound on/off toggle (44 px+ target). `aria-pressed` is true while sound is on, so the stable
 * name "Geluid" reads as "Geluid, aan/uit" to screen readers; the icon (and the text in the
 * full variant) shows the state.
 */
export const MuteToggle = ({ className, compact = false }: MuteToggleProps) => {
  const { muted, toggleMuted } = useSoundEffects();
  const Icon = muted ? VolumeX : Volume2;

  return (
    <Button
      type="button"
      variant={compact ? "outline" : "ghost"}
      size={compact ? "icon" : "default"}
      aria-pressed={!muted}
      aria-label="Geluid"
      title={muted ? "Geluid uit" : "Geluid aan"}
      onClick={toggleMuted}
      className={className}
    >
      <Icon aria-hidden="true" className={compact ? undefined : "size-5"} />
      {compact ? null : <span aria-hidden="true">{muted ? "Geluid uit" : "Geluid aan"}</span>}
    </Button>
  );
};
