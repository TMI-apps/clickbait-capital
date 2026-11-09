import { describe, expect, it, vi, afterEach } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { UI_COPY } from "@/features/game-content/api";
import { FollowerChat } from "@/features/follower-chat/components/FollowerChat";
import {
  CHAT_ANNOUNCE_AFTER_MS,
  CHAT_STAGGER_MS,
} from "@/features/follower-chat/hooks/useChatFeed";
import type { ChatBatch } from "@/features/follower-chat/types/followerChat.types";

const batch = (key: number, texts: string[]): ChatBatch => ({
  key,
  pace: "calm",
  messages: texts.map((text, index) => ({
    key: `${key}-${index}`,
    kind: "line",
    followerId: `f${index}`,
    name: `Volger${index}`,
    face: "🙂",
    tone: "primary",
    text,
  })),
});

const chatList = () =>
  within(screen.getByRole("region", { name: UI_COPY.chat.label })).getByRole("list");

afterEach(() => vi.useRealTimers());

describe("FollowerChat", () => {
  it("should show the waiting line when no action was taken", () => {
    render(<FollowerChat batch={null} revealKey={0} />);
    expect(screen.getByText(UI_COPY.chat.waiting)).toBeInTheDocument();
  });

  it("should reveal the lines one by one and announce only the first after them when a new batch reaches its reveal key", () => {
    vi.useFakeTimers();
    const { rerender } = render(<FollowerChat batch={null} revealKey={0} />);
    rerender(<FollowerChat batch={batch(1, ["eerste", "tweede"])} revealKey={1} />);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(within(chatList()).getAllByRole("listitem")).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(CHAT_STAGGER_MS.calm);
    });
    expect(within(chatList()).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("Chat: Volger0: eerste")).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(CHAT_ANNOUNCE_AFTER_MS);
    });
    expect(screen.getByText("Chat: Volger0: eerste")).toBeInTheDocument();
  });

  it("should wait while the reveal key is behind when an event dialog still closes", () => {
    vi.useFakeTimers();
    const { rerender } = render(<FollowerChat batch={null} revealKey={0} />);
    rerender(<FollowerChat batch={batch(1, ["na het event"])} revealKey={0} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText("na het event")).not.toBeInTheDocument();
    rerender(<FollowerChat batch={batch(1, ["na het event"])} revealKey={1} />);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByText("na het event")).toBeInTheDocument();
  });

  it("should stay quiet when the batch was already there at mount", () => {
    vi.useFakeTimers();
    render(<FollowerChat batch={batch(3, ["oud"])} revealKey={3} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText("oud")).not.toBeInTheDocument();
  });
});
