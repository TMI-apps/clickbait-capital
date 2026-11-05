/**
 * Glossary markup in player-facing strings (kids-content D1): `[[woord]]` marks a hard word,
 * `[[getoonde vorm|term]]` shows one form and looks up another (plurals, inflections). Terms
 * are looked up in lower case. Pure: the kit renders segments, content tests list the terms,
 * plain-text paths (feed, announcements) strip the markup.
 */

/** A run of plain text, or a marked word with the glossary key it looks up. */
export type GlossarySegment =
  | { kind: "text"; text: string }
  | { kind: "term"; text: string; term: string };

const MARKUP = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/** Splits a marked string into text and term segments, in order. */
export function parseGlossaryMarkup(text: string): GlossarySegment[] {
  const segments: GlossarySegment[] = [];
  let last = 0;
  for (const match of text.matchAll(MARKUP)) {
    const [whole, shown, key] = match;
    if (match.index > last) segments.push({ kind: "text", text: text.slice(last, match.index) });
    segments.push({ kind: "term", text: shown, term: (key ?? shown).trim().toLowerCase() });
    last = match.index + whole.length;
  }
  if (last < text.length) segments.push({ kind: "text", text: text.slice(last) });
  return segments;
}

/** The string as a reader sees it, without markup (screen-reader announcements, feed). */
export function stripGlossaryMarkup(text: string): string {
  return text.replace(MARKUP, (_whole, shown: string) => shown);
}

/** The glossary keys a string looks up, in order (duplicates kept). */
export function glossaryTermsIn(text: string): string[] {
  return parseGlossaryMarkup(text).flatMap((segment) =>
    segment.kind === "term" ? [segment.term] : []
  );
}
