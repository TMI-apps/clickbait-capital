/** Length limits of an app name, counted in characters after trimming (app-name lap). */
export const APP_NAME_MIN_LENGTH = 2;
export const APP_NAME_MAX_LENGTH = 16;

/** Why a name is refused; the naming step shows the matching `UI_COPY.appName.errors` line. */
export type AppNameError = "empty" | "short" | "long" | "chars" | "blocked";

export type AppNameCheck = { ok: true; name: string } | { ok: false; error: AppNameError };
