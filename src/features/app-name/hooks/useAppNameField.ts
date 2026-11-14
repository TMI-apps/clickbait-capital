import { useCallback, useState } from "react";
import { checkAppName, suggestAppName } from "@/features/app-name/services/appNameRules";
import type { AppNameError } from "@/features/app-name/types/appName.types";

export interface AppNameField {
  name: string;
  /** Why the last Start was refused; cleared as soon as the player types or rolls again. */
  error: AppNameError | null;
  setName: (name: string) => void;
  /** Another invented name (the 🎲 button). */
  shuffle: () => void;
  /** Checks the name: the cleaned name when it is accepted, else null and `error` is set. */
  submit: () => string | null;
}

/** State of the naming step's field (app-name lap): the typed name and its refusal reason. */
export function useAppNameField(initialName?: string): AppNameField {
  const [name, setNameState] = useState(() => initialName ?? suggestAppName());
  const [error, setError] = useState<AppNameError | null>(null);

  const setName = useCallback((next: string) => {
    setNameState(next);
    setError(null);
  }, []);

  const shuffle = useCallback(() => {
    setNameState((current) => suggestAppName(current));
    setError(null);
  }, []);

  const submit = useCallback((): string | null => {
    const check = checkAppName(name);
    if (check.ok) return check.name;
    setError(check.error);
    return null;
  }, [name]);

  return { name, error, setName, shuffle, submit };
}
