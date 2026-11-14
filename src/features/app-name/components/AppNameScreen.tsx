import { useId, type FormEvent } from "react";
import { Dices, Rocket } from "lucide-react";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { useAppNameField } from "@/features/app-name/hooks/useAppNameField";
import { APP_NAME_MAX_LENGTH } from "@/features/app-name/types/appName.types";
import { UI_COPY } from "@/features/game-content/api";
import { FlowScreen } from "@/features/game-flow/api";

/** Room to type past the limit, so the "te lang" message can show instead of a silent stop. */
const INPUT_MAX_LENGTH = APP_NAME_MAX_LENGTH + 8;

export interface AppNameScreenProps {
  /** The cleaned, accepted name; the run starts with it. */
  onStart: (appName: string) => void;
  /** First suggestion (tests pin it); a random invented name otherwise. */
  initialName?: string;
}

/**
 * The naming step before a new run (app-name lap): "Hoe heet jouw app?" with a suggested name,
 * a dice for another one and Start. The name is checked on Start (`checkAppName`); a refused
 * name shows its reason under the field and keeps the player here. Built on game-flow's
 * `FlowScreen`, so like every flow screen the heading takes focus first (game-flow D1); Enter in
 * the field submits.
 */
export const AppNameScreen = ({ onStart, initialName }: AppNameScreenProps) => {
  const copy = UI_COPY.appName;
  const formId = useId();
  const hintId = useId();
  const errorId = useId();
  const { name, error, setName, shuffle, submit } = useAppNameField(initialName);

  const start = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const accepted = submit();
    if (accepted !== null) onStart(accepted);
  };

  return (
    <FlowScreen
      kicker={copy.kicker}
      title={copy.title}
      icon={<Rocket aria-hidden="true" className="size-8 text-primary" />}
      actions={
        <>
          <Button variant="outline" className="min-h-11" onClick={shuffle}>
            <Dices aria-hidden="true" />
            {copy.shuffleButton}
          </Button>
          <Button type="submit" form={formId} className="min-h-11">
            {copy.startButton}
          </Button>
        </>
      }
    >
      <p className="text-base">{copy.body}</p>
      <form id={formId} noValidate onSubmit={start} className="flex flex-col gap-1.5">
        <FormField
          label={copy.label}
          name="appName"
          value={name}
          maxLength={INPUT_MAX_LENGTH}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint="go"
          className="min-h-11 text-base"
          aria-invalid={error !== null}
          aria-describedby={error ? `${errorId} ${hintId}` : hintId}
          onChange={(event) => setName(event.target.value)}
        />
        <p id={hintId} className="text-sm text-muted-foreground">
          {copy.hint}
        </p>
        {error && (
          <p id={errorId} role="alert" className="text-sm font-semibold text-destructive">
            {copy.errors[error]}
          </p>
        )}
      </form>
    </FlowScreen>
  );
};
