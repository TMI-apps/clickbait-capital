import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThumbnailFrame } from "./ThumbnailFrame";

const photo = <img src="/cards/x.webp" alt="Een verbaasde man met open mond." />;

describe("ThumbnailFrame", () => {
  it("should keep the photo's alt text as the only accessible content when treated", () => {
    render(
      <ThumbnailFrame
        accent="viral"
        treatment={{
          caption: "Echt waar?!",
          sticker: "😱",
          marker: { shape: "arrow", x: 70, y: 30 },
        }}
      >
        {photo}
      </ThumbnailFrame>
    );

    expect(
      screen.getByRole("img", { name: "Een verbaasde man met open mond." })
    ).toBeInTheDocument();
    expect(screen.queryByText("Echt waar?!")?.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("should draw caption, sticker and marker from the treatment data when given", () => {
    const { container } = render(
      <ThumbnailFrame
        accent="ad"
        treatment={{ caption: "Gratis!", sticker: "🤑", marker: { shape: "circle", x: 30, y: 60 } }}
      >
        {photo}
      </ThumbnailFrame>
    );

    expect(container.querySelector("[data-slot='thumbnail-caption']")).toHaveTextContent("Gratis!");
    expect(container.querySelector("[data-slot='thumbnail-sticker']")).toHaveTextContent("🤑");
    expect(container.querySelector("[data-slot='thumbnail-marker']")).toHaveAttribute(
      "data-shape",
      "circle"
    );
    expect(container.querySelector("[data-slot='thumbnail-frame']")).toHaveAttribute(
      "data-accent",
      "ad"
    );
  });

  it("should draw only the boost and outline when no treatment is given", () => {
    const { container } = render(<ThumbnailFrame accent="news">{photo}</ThumbnailFrame>);

    expect(container.querySelector("[data-slot='thumbnail-caption']")).toBeNull();
    expect(container.querySelector("[data-slot='thumbnail-sticker']")).toBeNull();
    expect(container.querySelector("[data-slot='thumbnail-marker']")).toBeNull();
  });

  it("should point the arrow tip at the marker point when the marker is an arrow", () => {
    const { container } = render(
      <ThumbnailFrame accent="event" treatment={{ marker: { shape: "arrow", x: 20, y: 80 } }}>
        {photo}
      </ThumbnailFrame>
    );

    expect(
      container.querySelector("[data-slot='thumbnail-marker']")?.getAttribute("transform")
    ).toBe("translate(20 60) rotate(155)");
  });
});
