/**
 * Public API of the follower-comments feature (the followers' comments under each feed post).
 * Other features import only from here (`@/features/follower-comments/api`).
 */
export {
  CommentAnnouncer,
  PostComments,
} from "@/features/follower-comments/components/PostComments";
export type {
  CommentAnnouncerProps,
  PostCommentsProps,
} from "@/features/follower-comments/components/PostComments";
export { useCommentReveal } from "@/features/follower-comments/hooks/useCommentReveal";
export type { CommentReveal } from "@/features/follower-comments/hooks/useCommentReveal";
export {
  commentsForSession,
  commentsForStep,
} from "@/features/follower-comments/services/followerComments";
export type * from "@/features/follower-comments/types/followerComments.types";
