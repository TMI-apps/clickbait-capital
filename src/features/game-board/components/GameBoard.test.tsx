import { describe, expect, it, onTestFinished, vi } from "vitest";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";
import type { GameContent } from "@/features/game-engine/api";
import { SEED_CONTENT, createGame } from "@/features/game-engine/api";
import { GAME_CONTENT } from "@/features/game-content/api";
import type { SavedRun } from "@/features/game-save/api";
import { getMotionStore } from "@/features/game-settings/api";
import { GameBoard } from "@/features/game-board/components/GameBoard";
import { PhoneFeed } from "@/features/game-board/components/PhoneFeed";
import type { FeedEntry } from "@/features/game-board/types/gameBoard.types";
import { renderWithProviders } from "tests/test-utils";

/**
 * Seed content where the first viral card (Toxicity > 0) triggers the first event: pacing lets
 * a regular event open from turn 1 (game-engine D10).
 */
const EVENT_NOW: GameContent = {
  ...SEED_CONTENT,
  balance: {
    ...SEED_CONTENT.balance,
    eventPacing: { ...SEED_CONTENT.balance.eventPacing, minTurnsBetween: 1 },
  },
  events: [{ ...SEED_CONTENT.events[0], trigger: { kind: "toxicity", threshold: 0 } }],
};

/** Seed content where the passive costs bankrupt the platform on the first card. */
const BANKRUPT_NOW: GameContent = {
  ...SEED_CONTENT,
  events: [],
  phases: SEED_CONTENT.phases.map((phase) => ({ ...phase, passiveCosts: { revenue: -100 } })),
};

/** Seed content where phase 1's goal holds after the first card. */
const MILESTONE_NOW: GameContent = {
  ...SEED_CONTENT,
  events: [],
  phases: SEED_CONTENT.phases.map((phase) =>
    phase.id === 1
      ? { ...phase, goal: { ...phase.goal, conditions: [], consecutiveTurns: 1 } }
      : phase
  ),
};

/** Seed content where every phase goal holds after one card: four cards win the IPO. */
const WIN_FAST: GameContent = {
  ...SEED_CONTENT,
  events: [],
  phases: SEED_CONTENT.phases.map((phase) => ({
    ...phase,
    goal: { ...phase.goal, conditions: [], consecutiveTurns: 1 },
  })),
};

const draftCards = (): HTMLElement[] =>
  within(screen.getByRole("region", { name: /kies een post/i }))
    .getAllByRole("button")
    .filter((button) => button.dataset.slot === "game-card");

const DEFAULT_SEED = 11;
/** First hand on `SEED_CONTENT`: viral, news, ad (seed 11 draws ad, ad, news). */
const VIRAL_SEED = 8;

/** The draft's card of a type; slots are not tied to types (shuffled-hand D1). */
const draftCardOfType = (type: string): HTMLElement => {
  const card = draftCards().find((candidate) => candidate.dataset.type === type);
  if (!card) throw new Error(`this seed draws no ${type} card here`);
  return card;
};

const feed = (): HTMLElement => screen.getByRole("region", { name: "Je feed" });
/** The feed's posts, without the comment lists nested in them. */
const posts = (): HTMLElement[] => [...feed().querySelectorAll<HTMLElement>("li[data-variant]")];

type User = ReturnType<typeof userEvent.setup>;

/** Confirms the open detail dialog (game-board D2: a tap or Enter opens it, its button plays). */
const confirmPlay = async (user: User): Promise<void> => {
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "In de feed" }));
};

/** The board's turn announcer; the feed comments have their own (follower-chat D5). */
const BOARD_LIVE_REGION = '[aria-live="polite"]:not([data-comment-announcer])';

/** Plays a draft card the tap way: tap opens the details, "In de feed" plays it. */
const playCard = async (user: User, card: HTMLElement): Promise<void> => {
  await user.click(card);
  await confirmPlay(user);
};

/** Renders the board and continues past the phase 1 intro (game-flow D2). */
const renderBoard = async (content: GameContent = SEED_CONTENT, seed = DEFAULT_SEED) => {
  const onQuit = vi.fn();
  renderWithProviders(<GameBoard content={content} onQuit={onQuit} seed={seed} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Aan de slag" }));
  return { onQuit, user };
};

describe("GameBoard", () => {
  it("should show three meters at 50 and a three-card draft when a run starts", async () => {
    await renderBoard();
    expect(screen.getAllByRole("meter").map((m) => m.getAttribute("aria-valuenow"))).toEqual([
      "50",
      "50",
      "50",
    ]);
    expect(draftCards()).toHaveLength(3);
    expect(screen.getByText("De Zolderkamer")).toBeInTheDocument();
  });

  it("should play the next card when the player uses an arrow key and Enter", async () => {
    const { user } = await renderBoard();
    const [first, second] = draftCards();
    first.focus();

    await user.keyboard("{ArrowRight}");
    expect(second).toHaveFocus();
    await user.keyboard("{Enter}");
    await confirmPlay(user);

    expect(within(feed()).getByText("Advertentie")).toBeInTheDocument();
  });

  it("should require an option when an event interrupts the draft", async () => {
    const { user } = await renderBoard(EVENT_NOW);
    await playCard(user, draftCards()[0]);

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Sluiten" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /moderatie/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(feed()).getByText("Investeer in moderatie.")).toBeInTheDocument();
  });

  it("should show the phase 1 intro before the board when a run starts", async () => {
    renderWithProviders(<GameBoard content={SEED_CONTENT} onQuit={vi.fn()} seed={11} />);
    expect(screen.getByRole("heading", { level: 1, name: "Fase 1: De Zolderkamer" })).toHaveFocus();
    expect(screen.queryByRole("region", { name: /kies een post/i })).not.toBeInTheDocument();
  });

  it("should show the next phase intro when a milestone is reached", async () => {
    const { user } = await renderBoard(MILESTONE_NOW);
    await playCard(user, draftCards()[0]);

    expect(screen.getByRole("heading", { level: 1, name: "Fase 2: De Scale-Up" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Aan de slag" }));
    expect(draftCards()).toHaveLength(3);
  });

  it("should show the IPO ending and then the end report when the run is won", async () => {
    const { user } = await renderBoard(WIN_FAST);
    for (let phase = 1; phase < 4; phase++) {
      await playCard(user, draftCards()[2]);
      await user.click(screen.getByRole("button", { name: "Aan de slag" }));
    }
    await playCard(user, draftCards()[2]);

    expect(screen.getByText("Beursgang geslaagd")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /: Gefeliciteerd met je beursgang!$/ })
    ).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Bekijk je rapport" }));
    expect(screen.getByText("Wat je bedrijf waard is op dag één")).toBeInTheDocument();
    expect(screen.getByText("Keer dat nepnieuws werd gedeeld")).toBeInTheDocument();
  });

  it("should go from the ending to the results and restart when the game is over", async () => {
    const { user, onQuit } = await renderBoard(BANKRUPT_NOW);
    await playCard(user, draftCards()[1]);

    expect(screen.getByRole("heading", { level: 1, name: /: Bankroet$/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Bekijk je rapport" }));
    expect(screen.getByRole("heading", { name: "Je rapport. Game over: Bankroet" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Naar het begin" }));
    expect(onQuit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Opnieuw spelen" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Fase 1: De Zolderkamer" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aan de slag" }));
    expect(posts()).toHaveLength(0);
  });

  it("should quit to the start when the player stops from the pause menu", async () => {
    const { user, onQuit } = await renderBoard();
    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(screen.getByRole("button", { name: "Stoppen" }));
    expect(onQuit).toHaveBeenCalledTimes(1);
  });
});

describe("GameBoard card details", () => {
  it("should open the details when the player taps a card and play it from there", async () => {
    const { user } = await renderBoard();
    const [viral] = draftCards();
    const title = within(viral).getAllByText(/./)[1]?.textContent ?? "";

    await user.click(viral);
    expect(within(screen.getByRole("dialog")).getAllByText(title).length).toBeGreaterThan(0);
    await confirmPlay(user);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(posts()).toHaveLength(1);
    expect(within(feed()).getByText(title, { exact: false })).toBeInTheDocument();
  });

  it("should show the played card's photo in the newest feed post when a card is played", async () => {
    const { user } = await renderBoard(GAME_CONTENT);
    const withPhoto = draftCards().find((card) => within(card).queryByRole("img") !== null);
    if (!withPhoto) throw new Error("seed 11 draws no card with a photo");
    const alt = within(withPhoto).getByRole("img").getAttribute("alt") ?? "";

    await playCard(user, withPhoto);

    const [newest] = posts();
    const photo = within(newest).getByRole("img", { name: alt });
    expect(photo).toHaveAttribute("loading", "lazy");
  });

  // Regression lock (feed-top-card D1): the newest post is the top-image card on every screen
  // size. jsdom has no layout, so the test pins the structure: photo first, one column, no
  // size- or breakpoint-dependent variant that could put the photo beside the text again.
  it("should render the newest post as a card with the photo on top when a card is played", async () => {
    const { user } = await renderBoard(GAME_CONTENT);
    const withPhoto = draftCards().find((card) => within(card).queryByRole("img") !== null);
    if (!withPhoto) throw new Error("seed 11 draws no card with a photo");

    await playCard(user, withPhoto);

    const [newest] = posts();
    expect(newest).toHaveAttribute("data-variant", "newest");
    expect(newest.className).toMatch(/\bflex-col\b/);
    expect(newest.className).not.toMatch(/grid-cols-|@container|\b(sm|md|lg|board-\w+):/);
    expect(within(newest.firstElementChild as HTMLElement).getByRole("img")).toBeInTheDocument();
  });

  it("should show a compact older post and keep its text when a second card is played", async () => {
    const { user } = await renderBoard();
    const firstTitle = within(draftCards()[0]).getAllByText(/./)[1]?.textContent ?? "";
    await playCard(user, draftCards()[0]);
    await playCard(user, draftCards()[1]);

    const [newest, older] = posts();
    expect(newest).toHaveAttribute("data-variant", "newest");
    expect(older).toHaveAttribute("data-variant", "compact");
    expect(within(older).getByText(firstTitle)).toBeInTheDocument();
    // Seed ids have no photo: the type-icon placeholder, no <img>.
    expect(within(feed()).queryAllByRole("img")).toHaveLength(0);
  });

  it("should leave the draft unchanged when the player closes the details", async () => {
    const { user } = await renderBoard();

    await user.click(draftCards()[0]);
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Toch niet" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(posts()).toHaveLength(0);
    expect(draftCards()[0]).toHaveFocus();
    expect(screen.queryByRole("button", { name: /^Details:/ })).not.toBeInTheDocument();
  });
});

describe("GameBoard juice", () => {
  it("should throw emoji and put flames on Gebruikers when a viral card is played", async () => {
    const { user } = await renderBoard(SEED_CONTENT, VIRAL_SEED);
    await playCard(user, draftCardOfType("viral"));

    expect(document.querySelectorAll('[data-juice-particle="emoji"]').length).toBeGreaterThan(0);
    expect(screen.getByRole("list", { name: "Meters" }).textContent).toContain("🔥");
  });

  it("should fly coins with a gold accent for an ad and only show a shield for news", async () => {
    const { user } = await renderBoard();
    await playCard(user, draftCardOfType("ad"));
    expect(document.querySelectorAll('[data-juice-particle="coin"]').length).toBeGreaterThan(0);
    expect(document.querySelector('[data-juice-accent="gold"]')).not.toBeNull();

    await playCard(user, draftCardOfType("news"));
    expect(document.querySelectorAll("[data-juice-particle]")).toHaveLength(0);
    expect(document.querySelector('[data-juice-accent="shield"]')).not.toBeNull();
  });

  it("should give the board the card juice of the chosen option's kind when an event is answered", async () => {
    const { user } = await renderBoard(EVENT_NOW);
    await playCard(user, draftCards()[0]);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /groei/ }));
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.querySelectorAll('[data-juice-particle="emoji"]').length).toBeGreaterThan(0);
    const meters = screen.getByRole("list", { name: "Meters" });
    expect(meters.querySelector('[data-juice-accent="flames"]')).not.toBeNull();
    expect(meters.querySelector('[data-juice-flash="gain"]')).not.toBeNull();
  });

  it("should throw no particles but keep the state change when the player chooses Verminderd", async () => {
    act(() => getMotionStore().setPreference("reduced"));
    onTestFinished(() => act(() => getMotionStore().reset()));
    const { user } = await renderBoard(SEED_CONTENT, VIRAL_SEED);
    await playCard(user, draftCardOfType("viral"));

    expect(document.querySelectorAll("[data-juice-particle]")).toHaveLength(0);
    expect(screen.getByRole("list", { name: "Meters" }).textContent).toContain("🔥");
    expect(posts()).toHaveLength(1);
  });
});

describe("GameBoard feed comments", () => {
  /** DOM queries: an open dialog hides the board from the accessibility tree. */
  const commentsOf = (post: HTMLElement | undefined): HTMLElement[] => [
    ...(post?.querySelectorAll<HTMLElement>("[data-comments] li") ?? []),
  ];

  it("should show follower comments under the post when a card is played", async () => {
    const { user } = await renderBoard();
    expect(document.querySelector("[data-comments]")).toBeNull();
    await playCard(user, draftCards()[0]);
    await waitFor(() => expect(commentsOf(posts()[0]).length).toBeGreaterThanOrEqual(2));
  });

  it("should put the event's comments under the event post only after its dialog has closed", async () => {
    const { user } = await renderBoard(EVENT_NOW);
    await playCard(user, draftCards()[0]);
    await waitFor(() => expect(commentsOf(posts()[0]).length).toBeGreaterThanOrEqual(2));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /groei/ }));
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(commentsOf(posts()[0]).length).toBeGreaterThanOrEqual(2));
    expect(posts()[0]).toHaveAttribute("data-variant", "newest");
    // The card post below collapses to one comment plus "+N".
    expect(commentsOf(posts()[1])).toHaveLength(1);
    expect(posts()[1]).toHaveTextContent(/\+\d+ reacties?/);
  });
});

describe("GameBoard with a screen reader", () => {
  it("should focus the board heading when the board opens after the phase intro", async () => {
    await renderBoard();
    expect(screen.getByRole("heading", { level: 1, name: /De Zolderkamer/ })).toHaveFocus();
  });

  it("should announce the post, meter changes and goal line and keep the draft slot focused when a card is played", async () => {
    const { user } = await renderBoard();
    const slot = draftCards().indexOf(draftCardOfType("ad"));
    draftCards()[slot]!.focus();
    await user.keyboard("{Enter}");
    await confirmPlay(user);

    const live = document.querySelector(BOARD_LIVE_REGION);
    await waitFor(() => expect(live?.textContent).not.toBe(""));
    expect(live?.textContent).toMatch(/^Geplaatst: .+\. Inkomsten omhoog \d+, nu \d+\..*Bereik: /);
    expect(draftCards()[slot]).toHaveFocus();
  });

  it("should return focus to the draft and announce the play and the chosen policy together when an event is answered", async () => {
    const { user } = await renderBoard(EVENT_NOW);
    draftCards()[0].focus();
    await user.keyboard("{Enter}");
    await confirmPlay(user);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /moderatie/i }));
    await user.click(within(dialog).getByRole("button", { name: "Verder" }));

    await waitFor(() =>
      expect(document.querySelector(BOARD_LIVE_REGION)?.textContent).toMatch(
        /^Geplaatst: .+ Gekozen: Investeer in moderatie\./
      )
    );
    expect(draftCards()[0]).toHaveFocus();
  });
});

describe("GameBoard resumed from a save", () => {
  /** A one-card save on seed 11 for `content`. */
  const oneCardSave = (content: GameContent): SavedRun => ({
    version: 3,
    seed: 11,
    actions: [{ kind: "card", cardId: createGame({ content, seed: 11 }).hand?.[0] ?? "" }],
  });

  it("should open on the board and announce where the run stands when the phase did not change", async () => {
    renderWithProviders(
      <GameBoard content={SEED_CONTENT} onQuit={vi.fn()} savedRun={oneCardSave(SEED_CONTENT)} />
    );

    expect(screen.queryByRole("button", { name: "Aan de slag" })).not.toBeInTheDocument();
    expect(screen.getByText("Beurt 1")).toBeInTheDocument();
    expect(await screen.findByText(/^Spel hervat\. Fase 1 van 4: /)).toBeInTheDocument();
  });

  it("should show the resumed post's comments at once without announcing them when a save is resumed", () => {
    renderWithProviders(
      <GameBoard content={SEED_CONTENT} onQuit={vi.fn()} savedRun={oneCardSave(SEED_CONTENT)} />
    );

    const comments = posts()[0]?.querySelectorAll("[data-comments] li") ?? [];
    expect(comments.length).toBeGreaterThanOrEqual(2);
    expect(document.querySelector("[data-comment-announcer]")?.textContent).toBe("");
  });

  it("should show the phase intro again when the last action started a new phase", () => {
    renderWithProviders(
      <GameBoard content={MILESTONE_NOW} onQuit={vi.fn()} savedRun={oneCardSave(MILESTONE_NOW)} />
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Fase 2/);
    expect(screen.getByRole("button", { name: "Aan de slag" })).toBeInTheDocument();
  });
});

const ENTRIES: FeedEntry[] = [
  { key: "card-2-v1", step: 1, contentId: "v1", type: "viral", title: "Nieuwste", body: "Nieuw." },
  { key: "card-1-a1", step: 0, contentId: "a1", type: "ad", title: "Ouder", body: "Oud." },
];

const renderFeed = (dragging: boolean) =>
  renderWithProviders(
    <DndContext>
      <PhoneFeed entries={ENTRIES} comments={[]} revealKey={2} dragging={dragging} />
    </DndContext>
  );

const dropSlot = (): Element | null => document.querySelector("[data-drop-slot]");

describe("PhoneFeed drop slot", () => {
  it("should open a slot above the newest post in the list flow when a card is dragged", () => {
    renderFeed(true);

    expect(dropSlot()?.getAttribute("data-drop-slot")).toBe("open");
    expect(screen.getByText("Laat los om te plaatsen")).toBeInTheDocument();
    const list = screen.getByRole("list");
    // In the scroll flow before the posts, not an absolute overlay on top of them.
    expect(dropSlot()?.compareDocumentPosition(list)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(dropSlot()?.className).not.toMatch(/absolute/);
  });

  it("should keep the slot closed and hidden when nothing is dragged", () => {
    renderFeed(false);

    expect(dropSlot()?.getAttribute("data-drop-slot")).toBe("closed");
    expect(dropSlot()?.getAttribute("aria-hidden")).toBe("true");
  });
});
