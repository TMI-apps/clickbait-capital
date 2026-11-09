/**
 * Public API of the follower-chat feature (the followers' live chat under the feed). Other
 * features import only from here (`@/features/follower-chat/api`).
 */
export { FollowerChat } from "@/features/follower-chat/components/FollowerChat";
export type { FollowerChatProps } from "@/features/follower-chat/components/FollowerChat";
export { chatForSession, chatForStep } from "@/features/follower-chat/services/chatReactions";
export type * from "@/features/follower-chat/types/followerChat.types";
