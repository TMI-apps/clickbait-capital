import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/common/Button/Button";
import { useSoundEffects } from "@/features/game-audio/hooks/useSoundEffects";

export interface MuteToggleProps {
  className?: string;
}

/**
 * Sound on/off toggle (44 px+ target). `aria-pressed` is true while sound is on, so the stable
 * name "Geluid" reads as "Geluid, aan/uit" to screen readers; the icon and text show the state.
 */
export const MuteToggle = ({ className }: MuteToggleProps) => {
  const { muted, toggleMuted } = useSoundEffects();
  const Icon = muted ? VolumeX : Volume2;

  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={!muted}
      aria-label="Geluid"
      onClick={toggleMuted}
      className={className}
    >
      <Icon aria-hidden="true" className="size-5" />
      <span aria-hidden="true">{muted ? "Geluid uit" : "Geluid aan"}</span>
    </Button>
  );
};
