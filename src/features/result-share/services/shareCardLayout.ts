/** Measures the drawn width of a string in the current canvas font. */
export type MeasureText = (text: string) => number;

export interface WrapTextOptions {
  maxWidth: number;
  /** Lines beyond this are dropped and the last kept line ends in "…". */
  maxLines: number;
  measure: MeasureText;
}

const ELLIPSIS = "…";

function withEllipsis(line: string, { maxWidth, measure }: WrapTextOptions): string {
  let trimmed = line;
  while (trimmed.length > 0 && measure(`${trimmed}${ELLIPSIS}`) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed.trimEnd()}${ELLIPSIS}`;
}

/**
 * Greedy word wrap for canvas text, which has no line breaking of its own. A single word wider
 * than the line stays on its own line (Dutch compounds are long; the card fonts keep them in
 * bounds at the sizes used). Text that needs more than `maxLines` is cut with an ellipsis.
 */
export function wrapText(text: string, options: WrapTextOptions): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && options.measure(candidate) > options.maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= options.maxLines) return lines;
  const kept = lines.slice(0, options.maxLines);
  kept[kept.length - 1] = withEllipsis(
    `${kept[kept.length - 1]} ${lines[options.maxLines]}`,
    options
  );
  return kept;
}

/** Host and path of a URL for printing ("clickbait-capital.example"), without scheme or trailing slash. */
export function toDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
