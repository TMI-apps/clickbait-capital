import { UI_COPY } from "@/features/game-content/api";
import { useSoundEffects } from "@/features/game-audio/api";
import { ResetProgressSection } from "@/features/game-settings/components/ResetProgressSection";
import { SettingRow } from "@/features/game-settings/components/SettingRow";
import { useHapticsPreference } from "@/features/game-settings/hooks/useHapticsPreference";
import { useMotionPreference } from "@/features/game-settings/hooks/useMotionPreference";
import type { MotionPreference } from "@/features/game-settings/types/motionPreference.types";
import { useColorMode } from "@/shared/context/ColorModeContext";
import type { ColorMode } from "@/shared/theme/colorMode";

const COPY = UI_COPY.settings;

type OnOff = "on" | "off";

/** Aan / Uit, for sound and vibration. */
const SOUND_OPTIONS: { value: OnOff; label: string }[] = [
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
 * All game settings in one panel: used by `/instellingen` (the board has no pause menu since
 * chart-juice D5; its start screen links here). Each setting writes to its own source of truth
 * (game-audio mute, the motion and vibration stores, ColorModeContext); nothing is copied here.
 */
export const SettingsPanel = () => {
  const { muted, setMuted } = useSoundEffects();
  const { preference, setPreference } = useMotionPreference();
  const { mode, setMode } = useColorMode();
  const haptics = useHapticsPreference();

  return (
    <div className="flex flex-col gap-5 text-left">
      <SettingRow
        label={COPY.sound}
        options={SOUND_OPTIONS}
        value={muted ? "off" : "on"}
        onValueChange={(value) => setMuted(value === "off")}
      />
      {/* Only where the browser can vibrate: iPhones would show a switch that does nothing. */}
      {haptics.available && (
        <SettingRow
          label={COPY.vibration}
          hint={COPY.vibrationHint}
          options={SOUND_OPTIONS}
          value={haptics.enabled ? "on" : "off"}
          onValueChange={(value) => haptics.setEnabled(value === "on")}
        />
      )}
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
