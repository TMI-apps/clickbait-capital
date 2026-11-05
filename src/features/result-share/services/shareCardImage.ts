import { toDisplayUrl, wrapText } from "@/features/result-share/services/shareCardLayout";
import type { ShareCardContent } from "@/features/result-share/types/resultShare.types";

/** 4:5 portrait: the largest shape feeds and chat previews show uncropped. */
export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;

const PAD = 88;
const INNER = SHARE_CARD_WIDTH - PAD * 2;
const BAND_HEIGHT = 480;
const STAT_ROW_HEIGHT = 100;
/** Top of the footer block ("Speel gratis op" + link), measured from the bottom padding. */
const FOOTER_TOP = SHARE_CARD_HEIGHT - PAD - 96;
const GAP = 48;
/** Headline sizes from loud to compact; the first whose wrap fits the free space wins. */
const HEADLINE_SIZES = [
  { font: 52, lineHeight: 66 },
  { font: 44, lineHeight: 56 },
  { font: 38, lineHeight: 48 },
] as const;

/** Design tokens the card reads (result-share D4): the active theme, no hex values here. */
interface CardTokens {
  background: string;
  foreground: string;
  muted: string;
  card: string;
  border: string;
  primary: string;
  primaryForeground: string;
  gradientStart: string;
  headingFont: string;
  bodyFont: string;
}

function readTokens(root: HTMLElement): CardTokens {
  const style = getComputedStyle(root);
  const token = (name: string, fallback: string): string =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    background: token("--background", "white"),
    foreground: token("--foreground", "black"),
    muted: token("--muted-foreground", "gray"),
    card: token("--card", "white"),
    border: token("--border", "gray"),
    primary: token("--primary", "magenta"),
    primaryForeground: token("--primary-foreground", "white"),
    gradientStart: token("--primary-gradient-start", "purple"),
    headingFont: token("--heading-font", "sans-serif"),
    bodyFont: token("--body-font", "sans-serif"),
  };
}

/** Canvas text uses only loaded faces, so wait for the self-hosted fonts first. */
async function loadFonts(tokens: CardTokens): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  await Promise.allSettled([
    document.fonts.load(`700 96px ${tokens.headingFont}`),
    document.fonts.load(`600 52px ${tokens.headingFont}`),
    document.fonts.load(`500 34px ${tokens.bodyFont}`),
  ]);
}

interface DrawContext {
  ctx: CanvasRenderingContext2D;
  tokens: CardTokens;
}

/** Draws wrapped lines from `y` (top of the first line). */
function drawLines(
  { ctx }: DrawContext,
  lines: string[],
  { y, lineHeight }: { y: number; lineHeight: number }
): void {
  lines.forEach((line, index) => ctx.fillText(line, PAD, y + index * lineHeight));
}

/** Page background plus the neon gradient band (the brand button gradient, diagonal). */
function drawBackground({ ctx, tokens }: DrawContext): void {
  ctx.fillStyle = tokens.background;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
  const gradient = ctx.createLinearGradient(0, 0, SHARE_CARD_WIDTH, BAND_HEIGHT);
  gradient.addColorStop(0, tokens.gradientStart);
  gradient.addColorStop(1, tokens.primary);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SHARE_CARD_WIDTH, BAND_HEIGHT);
}

/** Below the kicker line, with breathing room. */
const TITLE_MIN_TOP = PAD + 84 + 36 + 40;

/** Ending title, bottom-aligned in the band; a two-line title steps down a size. */
function drawTitle(draw: DrawContext, title: string): void {
  const { ctx, tokens } = draw;
  const measure = (text: string): number => ctx.measureText(text).width;
  ctx.font = `700 96px ${tokens.headingFont}`;
  let lines = wrapText(title, { maxWidth: INNER, maxLines: 2, measure });
  let lineHeight = 104;
  if (lines.length > 1) {
    ctx.font = `700 80px ${tokens.headingFont}`;
    lines = wrapText(title, { maxWidth: INNER, maxLines: 2, measure });
    lineHeight = 88;
  }
  const top = Math.max(TITLE_MIN_TOP, BAND_HEIGHT - 64 - lines.length * lineHeight);
  drawLines(draw, lines, { y: top, lineHeight });
}

function drawBand(draw: DrawContext, content: ShareCardContent): void {
  const { ctx, tokens } = draw;
  ctx.fillStyle = tokens.primaryForeground;
  ctx.textBaseline = "top";
  ctx.font = `700 40px ${tokens.headingFont}`;
  ctx.fillText(content.appName.toUpperCase(), PAD, PAD, INNER);
  ctx.font = `600 36px ${tokens.bodyFont}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(content.kicker, PAD, PAD + 84, INNER);
  ctx.globalAlpha = 1;

  drawTitle(draw, content.title);
}

/** Fits the punchy line between the band and the stats panel, shrinking it before cutting. */
function drawHeadline(draw: DrawContext, content: ShareCardContent, bottom: number): void {
  const { ctx, tokens } = draw;
  const top = BAND_HEIGHT + 56;
  const text = `“${content.line}”`;
  ctx.fillStyle = tokens.foreground;
  ctx.textBaseline = "top";
  for (const [index, size] of HEADLINE_SIZES.entries()) {
    ctx.font = `600 ${size.font}px ${tokens.headingFont}`;
    const maxLines = Math.max(1, Math.floor((bottom - top) / size.lineHeight));
    const measure = (line: string): number => ctx.measureText(line).width;
    const lines = wrapText(text, { maxWidth: INNER, maxLines: 99, measure });
    const last = index === HEADLINE_SIZES.length - 1;
    if (lines.length <= maxLines || last) {
      drawLines(draw, wrapText(text, { maxWidth: INNER, maxLines, measure }), {
        y: top,
        lineHeight: size.lineHeight,
      });
      return;
    }
  }
}

/** Height of the stats panel for this many rows. */
const statsHeight = (rows: number): number => rows * STAT_ROW_HEIGHT + 32;

function drawStats(draw: DrawContext, content: ShareCardContent, top: number): void {
  const { ctx, tokens } = draw;
  const rowHeight = STAT_ROW_HEIGHT;
  const height = statsHeight(content.stats.length);
  ctx.fillStyle = tokens.card;
  ctx.strokeStyle = tokens.border;
  ctx.lineWidth = 3;
  ctx.beginPath();
  // roundRect is missing before Safari 16 / Firefox 112: a square panel beats a failed card.
  if (typeof ctx.roundRect === "function") ctx.roundRect(PAD, top, INNER, height, 32);
  else ctx.rect(PAD, top, INNER, height);
  ctx.fill();
  ctx.stroke();

  content.stats.forEach((stat, index) => {
    const y = top + 16 + index * rowHeight + rowHeight / 2;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = tokens.muted;
    ctx.font = `500 34px ${tokens.bodyFont}`;
    ctx.fillText(stat.label, PAD + 40, y);
    ctx.textAlign = "right";
    ctx.fillStyle = tokens.foreground;
    ctx.font = `700 48px ${tokens.headingFont}`;
    ctx.fillText(stat.value, SHARE_CARD_WIDTH - PAD - 40, y, INNER * 0.6);
  });
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
}

function drawFooter(draw: DrawContext, content: ShareCardContent): void {
  const { ctx, tokens } = draw;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = tokens.muted;
  ctx.font = `500 32px ${tokens.bodyFont}`;
  ctx.fillText(content.footerLabel, PAD, FOOTER_TOP + 32);
  ctx.fillStyle = tokens.primary;
  ctx.font = `700 40px ${tokens.headingFont}`;
  ctx.fillText(toDisplayUrl(content.url), PAD, SHARE_CARD_HEIGHT - PAD, INNER);
}

function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Share card could not be encoded"))),
      "image/png"
    );
  });
}

/**
 * Draws the share card for one run as a 1080×1350 PNG (result-share D1): a gradient band with
 * brand, kicker and ending title, the punchy line, a stats panel and the game link. Loaded
 * with `import()` so neither the main chunk nor the board carries it.
 */
export async function renderShareCard(content: ShareCardContent): Promise<Blob> {
  const tokens = readTokens(document.documentElement);
  await loadFonts(tokens);
  const canvas = Object.assign(document.createElement("canvas"), {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
  });
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  const draw: DrawContext = { ctx, tokens };

  drawBackground(draw);
  drawBand(draw, content);
  // The panel sits on the footer so it can never overlap it; the headline fits above it.
  const statsTop = FOOTER_TOP - GAP - statsHeight(content.stats.length);
  drawHeadline(draw, content, statsTop - GAP);
  drawStats(draw, content, statsTop);
  drawFooter(draw, content);
  return toPngBlob(canvas);
}
