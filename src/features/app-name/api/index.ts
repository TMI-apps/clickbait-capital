/**
 * Public API of the app-name feature: the rules for the name the player gives their app
 * (length, characters, swear words, real brands), the suggested names and the naming screen
 * shown before a new run. `/spel` imports only from here (`@/features/app-name/api`).
 */
export {
  checkAppName,
  isBlockedAppName,
  normalizeAppName,
  suggestAppName,
} from "@/features/app-name/services/appNameRules";
export { APP_NAME_MAX_LENGTH, APP_NAME_MIN_LENGTH } from "@/features/app-name/types/appName.types";
export type { AppNameCheck, AppNameError } from "@/features/app-name/types/appName.types";
export { APP_NAME_SUGGESTIONS } from "@/features/app-name/services/appNameSuggestions";
export {
  AppNameScreen,
  type AppNameScreenProps,
} from "@/features/app-name/components/AppNameScreen";
