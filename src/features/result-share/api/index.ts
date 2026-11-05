/**
 * Public API of the result-share feature: a share button that turns a finished run into an
 * image plus link (`@/features/result-share/api`). The canvas renderer is not exported; the
 * button's hook loads it on demand.
 */
export {
  ShareResultButton,
  type ShareResultButtonProps,
} from "@/features/result-share/components/ShareResultButton";
export type * from "@/features/result-share/types/resultShare.types";
