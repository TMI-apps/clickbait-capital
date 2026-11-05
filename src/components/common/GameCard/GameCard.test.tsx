import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GameCard } from "./GameCard";
import { GameCardGallery } from "./GameCardGallery";
import { SAMPLE_CARDS, SAMPLE_IMAGES } from "./gameCardFixtures";

const [viral, ad, news, event] = SAMPLE_CARDS;

describe("GameCard", () => {
  it.each([
    [viral, "Viraal"],
    [ad, "Advertentie"],
    [news, "Nieuws"],
    [event, "Gebeurtenis"],
  ])("should show the Dutch type label next to the colour when type is %#", (card, label) => {
    render(<GameCard {...card} />);

    expect(screen.getByRole("article", { name: card.title })).toHaveTextContent(label);
  });

  it("should show meter effects as signed numbers with meter names and spoken direction", () => {
    render(<GameCard {...news} />);
    const items = within(screen.getByRole("list")).getAllByRole("listitem");

    expect(items.map((item) => item.textContent)).toEqual([
      "Reputatie+8omhoog 8, ",
      "Gebruikers−4omlaag 4, ",
      "Inkomsten±0gelijk 0",
    ]);
  });

  it("should show the counted part and a MAX mark when part of a gain is wasted at the cap", () => {
    render(
      <GameCard type="ad" title="Gok-app" effects={[{ meter: "revenue", delta: 4, overflow: 8 }]} />
    );
    const item = within(screen.getByRole("list")).getByRole("listitem");

    expect(item.textContent).toBe("Inkomsten+4omhoog 4MAX, 8 verspild boven het maximum");
  });

  it("should keep full type and meter names for screen readers when the card is compact", () => {
    render(<GameCard {...ad} size="compact" />);
    const card = screen.getByRole("article", { name: ad.title });

    expect(card).toHaveTextContent("Reclame");
    expect(within(card).getByText("Advertentie")).toHaveClass("sr-only");
    expect(within(card).getAllByText("Inkomsten")[0]).toHaveClass("sr-only");
    if (ad.flavor) expect(card).not.toHaveTextContent(ad.flavor);
  });

  it("should be a static article without a button when onSelect is missing", () => {
    render(<GameCard {...viral} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should call onSelect from click, Enter and Space when the card is interactive", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<GameCard {...viral} onSelect={onSelect} />);
    const card = screen.getByRole("button", { name: /Woedende livestream/ });

    await user.click(card);
    card.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it("should expose selected state and a visible Gekozen label when selected", () => {
    render(<GameCard {...ad} selected onSelect={() => undefined} />);
    const card = screen.getByRole("button", { name: /Gok-app promo/ });

    expect(card).toHaveAttribute("aria-pressed", "true");
    expect(card).toHaveTextContent("Gekozen");
  });

  it("should not call onSelect when disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<GameCard {...news} disabled onSelect={onSelect} />);
    const card = screen.getByRole("button", { name: /Klimaatakkoord/ });

    await user.click(card);

    expect(card).toBeDisabled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("should name the type in the button and describe the effects when interactive", () => {
    render(<GameCard {...viral} onSelect={() => undefined} />);
    const card = screen.getByRole("button", { name: "Woedende livestream Viraal" });

    expect(card).toHaveAccessibleDescription(/Gebruikers.*omhoog 12/);
  });

  it("should crop the image around its focal point when one is given", () => {
    render(<GameCard {...viral} />);

    expect(screen.getByRole("img", { name: viral.image?.alt })).toHaveStyle({
      objectPosition: "70% 30%",
    });
  });

  it("should show the type icon fallback with the alt text when the image fails to load", () => {
    render(<GameCard {...viral} image={{ src: "/missing.png", alt: "Kapotte foto" }} />);

    fireEvent.error(screen.getByRole("img", { name: "Kapotte foto" }));

    expect(screen.getByRole("img", { name: "Kapotte foto" })).toHaveAttribute(
      "data-slot",
      "game-card-fallback"
    );
  });

  it("should show a fallback panel when no image is given", () => {
    const { container } = render(<GameCard {...event} />);

    expect(container.querySelector('[data-slot="game-card-fallback"]')).toBeInTheDocument();
  });

  it("should show the rarity label only when rarity is not common", () => {
    const { rerender } = render(<GameCard {...viral} rarity="common" />);
    expect(screen.queryByText(/Zeldzaam|Legendarisch/)).not.toBeInTheDocument();

    rerender(<GameCard {...viral} rarity="legendary" />);

    expect(screen.getByText("Legendarisch")).toBeInTheDocument();
  });

  it("should use the typeLabel override instead of the default label when given", () => {
    render(<GameCard {...viral} typeLabel="Breaking" />);

    expect(screen.getByRole("article")).toHaveTextContent("Breaking");
  });
});

describe("GameCardGallery", () => {
  it("should move the selection when another type card is chosen", async () => {
    const user = userEvent.setup();
    render(<GameCardGallery />);
    const typeSection = screen.getByRole("heading", { name: /Typen/ }).parentElement as HTMLElement;
    const [first, second] = within(typeSection).getAllByRole("button");

    await user.click(second);

    expect(first).toHaveAttribute("aria-pressed", "false");
    expect(second).toHaveAttribute("aria-pressed", "true");
  });

  it("should render every image shape when the gallery mounts", () => {
    render(<GameCardGallery />);

    for (const src of Object.values(SAMPLE_IMAGES)) {
      expect(document.querySelector(`img[src="${src}"]`)).toBeInTheDocument();
    }
  });

  it("should draw the thumbnail look on clickbait types but not on news when a photo is given", () => {
    const image = { src: SAMPLE_IMAGES.square, alt: "Een foto", thumbnail: { caption: "Wow!" } };
    const { container, rerender } = render(<GameCard type="viral" title="Viraal" image={image} />);
    expect(container.querySelector("[data-slot='thumbnail-frame']")).not.toBeNull();

    rerender(<GameCard type="news" title="Nieuws" image={image} />);
    expect(container.querySelector("[data-slot='thumbnail-frame']")).toBeNull();
    expect(screen.getByRole("img", { name: "Een foto" })).toBeInTheDocument();
  });
});
