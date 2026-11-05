import { describe, expect, it } from "vitest";
import { toDisplayUrl, wrapText } from "@/features/result-share/services/shareCardLayout";

/** One unit per character keeps expected lines readable. */
const measure = (text: string): number => text.length;

describe("wrapText", () => {
  it("should keep text on one line when it fits", () => {
    expect(wrapText("Servers op zwart", { maxWidth: 20, maxLines: 3, measure })).toEqual([
      "Servers op zwart",
    ]);
  });

  it("should break between words when a line gets too wide", () => {
    expect(
      wrapText("Groeiende app bezwijkt onder de rekening", { maxWidth: 14, maxLines: 5, measure })
    ).toEqual(["Groeiende app", "bezwijkt onder", "de rekening"]);
  });

  it("should keep a word wider than the line on its own line", () => {
    expect(
      wrapText("de aandeelhoudersvergadering juicht", { maxWidth: 10, maxLines: 5, measure })
    ).toEqual(["de", "aandeelhoudersvergadering", "juicht"]);
  });

  it("should end the last line with an ellipsis when the text needs more lines", () => {
    const lines = wrapText("een twee drie vier vijf zes", { maxWidth: 9, maxLines: 2, measure });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("een twee");
    expect(lines[1].endsWith("…")).toBe(true);
    expect(lines[1].length).toBeLessThanOrEqual(9);
  });

  it("should return no lines when the text is empty", () => {
    expect(wrapText("   ", { maxWidth: 10, maxLines: 2, measure })).toEqual([]);
  });
});

describe("toDisplayUrl", () => {
  it("should drop the scheme and trailing slash when printing the link", () => {
    expect(toDisplayUrl("https://clickbait-capital.tmi-5ba.workers.dev/")).toBe(
      "clickbait-capital.tmi-5ba.workers.dev"
    );
  });
});
