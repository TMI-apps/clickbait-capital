import { UI_COPY } from "@/features/game-content/api";
import { useSoundEffects } from "@/features/game-audio/api";
import { ResetProgressSection } from "@/features/game-settings/components/ResetProgressSection";
import { SettingRow } from "@/features/game-settings/components/SettingRow";
import { useMotionPreference } from "@/features/game-settings/hooks/useMotionPreference";
import type { MotionPreference } from "@/features/game-settings/types/motionPreference.types";
import { useColorMode } from "@/shared/context/ColorModeContext";
import type { ColorMode } from "@/shared/theme/colorMode";

const COPY = UI_COPY.settings;

type SoundValue = "on" | "off";

const SOUND_OPTIONS: { value: SoundValue; label: string }[] = [
  { value: "on", label: COPY.on },
  { value: "off", label: COPY.off },
];

const MOTION_OPTIONS: { value: MotionPreference; label: string }[] = [
  { value: "system", label: COPY.motionOptions.system },
  { value: "reduced", label: COPY.motionOptions.reduced },
  { value: "full", label: COPY.motionOptions.full },
];

const COLOR_MODE_OPTIONS: { value: ColorMode; label: string }[] = [
  { value: "light", label: COPY.colorModeOptions.light },
  { value: "dark", label: COPY.colorModeOptions.dark },
  { value: "system", label: COPY.colorModeOptions.system },
];

/**
 * All game settings in one panel: used by `/instellingen` and inside the board's pause menu,
 * so both always show the same controls. Each setting writes to its own source of truth
 * (game-audio mute, the motion store, ColorModeContext); nothing is copied here.
 */
export const SettingsPanel = () => {
  const { muted, setMuted } = useSoundEffects();
  const { preference, setPreference } = useMotionPreference();
  const { mode, setMode } = useColorMode();

  return (
    <div className="flex flex-col gap-5 text-left">
      <SettingRow
        label={COPY.sound}
        options={SOUND_OPTIONS}
        value={muted ? "off" : "on"}
        onValueChange={(value) => setMuted(value === "off")}
      />
      <SettingRow
        label={COPY.motion}
        hint={COPY.motionHint}
        options={MOTION_OPTIONS}
        value={preference}
        onValueChange={setPreference}
      />
      <SettingRow
        label={COPY.colorMode}
        options={COLOR_MODE_OPTIONS}
        value={mode}
        onValueChange={setMode}
      />
      <ResetProgressSection />
    </div>
  );
};
