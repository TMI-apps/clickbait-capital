import { parseGlossaryMarkup } from "@/shared/utils/glossaryMarkup";
import { GlossaryTerm } from "./GlossaryTerm";

export interface GlossaryTextProps {
  /** A string that may mark hard words as `[[woord]]` or `[[vorm|term]]`. */
  text: string;
  /** Term (lower case) → short meaning. A marked word missing here renders as plain text. */
  glossary: Readonly<Record<string, string>>;
}

/** Renders a marked string: plain text with a `GlossaryTerm` for every marked word. */
export const GlossaryText = ({ text, glossary }: GlossaryTextProps) => (
  <>
    {parseGlossaryMarkup(text).map((segment, index) => {
      const meaning = segment.kind === "term" ? glossary[segment.term] : undefined;
      return meaning ? (
        <GlossaryTerm key={index} meaning={meaning}>
          {segment.text}
        </GlossaryTerm>
      ) : (
        segment.text
      );
    })}
  </>
);
