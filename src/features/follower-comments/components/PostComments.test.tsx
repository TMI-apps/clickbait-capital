import { describe, expect, it, vi, afterEach } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { UI_COPY } from "@/features/game-content/api";
import {
  CommentAnnouncer,
  PostComments,
} from "@/features/follower-comments/components/PostComments";
import {
  COMMENT_ANNOUNCE_AFTER_MS,
  COMMENT_STAGGER_MS,
  useCommentReveal,
} from "@/features/follower-comments/hooks/useCommentReveal";
import type { CommentBatch } from "@/features/follower-comments/types/followerComments.types";

const batch = (key: number, texts: string[]): CommentBatch => ({
  key,
  pace: "calm",
  comments: texts.map((text, index) => ({
    key: `${key}-${index}`,
    kind: "line",
    followerId: `f${index}`,
    name: `Volger${index}`,
    face: "🙂",
    tone: "primary",
    text,
  })),
});

/** The newest post's comments as the feed wires them: reveal hook, full list, announcer. */
const NewestComments = ({ comments, revealKey }: { comments: CommentBatch; revealKey: number }) => {
  const reveal = useCommentReveal(comments, revealKey);
  return (
    <>
      <PostComments batch={comments} variant="full" shown={reveal.shown} reduced={reveal.reduced} />
      <CommentAnnouncer announcement={reveal.announcement} />
    </>
  );
};

const shownTexts = (): string[] =>
  (screen.queryByRole("list", { name: UI_COPY.comments.label }) === null
    ? []
    : within(screen.getByRole("list", { name: UI_COPY.comments.label })).getAllByRole("listitem")
  ).map((item) => item.textContent ?? "");

afterEach(() => vi.useRealTimers());

describe("PostComments", () => {
  it("should show only the first comment and a +N count when the post is older", () => {
    render(<PostComments batch={batch(1, ["een", "twee", "drie"])} variant="collapsed" />);
    expect(shownTexts()).toEqual(["🙂Volger0 een"]);
    expect(screen.getByText("+2 reacties")).toBeInTheDocument();
  });

  it("should show nothing when no comment is revealed yet", () => {
    const { container } = render(
      <PostComments batch={batch(1, ["een"])} variant="full" shown={0} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("useCommentReveal", () => {
  it("should reveal the comments one by one and announce only the first after them when a new batch reaches its reveal key", () => {
    vi.useFakeTimers();
    const first = batch(1, ["eerste", "tweede"]);
    const { rerender } = render(<NewestComments comments={first} revealKey={0} />);
    rerender(<NewestComments comments={first} revealKey={1} />);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(shownTexts()).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(COMMENT_STAGGER_MS.calm);
    });
    expect(shownTexts()).toHaveLength(2);
    expect(screen.queryByText("Reactie: Volger0: eerste")).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(COMMENT_ANNOUNCE_AFTER_MS);
    });
    expect(screen.getByText("Reactie: Volger0: eerste")).toBeInTheDocument();
  });

  it("should wait while the reveal key is behind when an event dialog still closes", () => {
    vi.useFakeTimers();
    const event = batch(2, ["na het event"]);
    const { rerender } = render(<NewestComments comments={batch(1, ["oud"])} revealKey={0} />);
    rerender(<NewestComments comments={event} revealKey={1} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText("na het event")).not.toBeInTheDocument();
    rerender(<NewestComments comments={event} revealKey={2} />);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(screen.getByText("na het event")).toBeInTheDocument();
  });

  it("should show the comments at once without an announcement when the batch was already there at mount", () => {
    vi.useFakeTimers();
    render(<NewestComments comments={batch(3, ["oud", "ouder"])} revealKey={3} />);
    expect(shownTexts()).toHaveLength(2);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText(/^Reactie:/)).not.toBeInTheDocument();
  });
});
