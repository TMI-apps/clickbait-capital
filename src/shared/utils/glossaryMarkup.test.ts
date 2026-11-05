import { describe, expect, it } from "vitest";
import {
  glossaryTermsIn,
  parseGlossaryMarkup,
  stripGlossaryMarkup,
} from "@/shared/utils/glossaryMarkup";

describe("parseGlossaryMarkup", () => {
  it("should split text and terms when a string marks a word", () => {
    expect(parseGlossaryMarkup("Jij bent het [[algoritme]].")).toEqual([
      { kind: "text", text: "Jij bent het " },
      { kind: "term", text: "algoritme", term: "algoritme" },
      { kind: "text", text: "." },
    ]);
  });

  it("should show one form and look up another when the term has a pipe", () => {
    expect(parseGlossaryMarkup("[[Influencers|influencer]] posten")).toEqual([
      { kind: "term", text: "Influencers", term: "influencer" },
      { kind: "text", text: " posten" },
    ]);
  });

  it("should look terms up in lower case when the shown word starts with a capital", () => {
    expect(parseGlossaryMarkup("[[Algoritme]]")[0]).toEqual({
      kind: "term",
      text: "Algoritme",
      term: "algoritme",
    });
  });

  it("should return one text segment when the string has no markup", () => {
    expect(parseGlossaryMarkup("Gewoon tekst")).toEqual([{ kind: "text", text: "Gewoon tekst" }]);
  });
});

describe("stripGlossaryMarkup", () => {
  it("should keep only the shown words when markup is removed", () => {
    expect(stripGlossaryMarkup("Een [[influencer]] en twee [[bots|bot]].")).toBe(
      "Een influencer en twee bots."
    );
  });
});

describe("glossaryTermsIn", () => {
  it("should list every looked-up term when a string marks several words", () => {
    expect(glossaryTermsIn("[[a]] en [[B]] en [[cc|c]]")).toEqual(["a", "b", "c"]);
  });
});
