import type { GameCardProps } from "./GameCard";

/**
 * Sample cards for tests and the states gallery (GameCardGallery). Not used by the app.
 * Images are inline SVGs of each shape, with a marked focal point, so no network is needed.
 */
const sampleImage = (width: number, height: number, label: string): string => {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9d4dff"/><stop offset="1" stop-color="#ff4fd8"/></linearGradient></defs>' +
    '<rect width="100%" height="100%" fill="url(#g)"/>' +
    `<circle cx="${width * 0.7}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.12}" fill="#ffc93c"/>` +
    `<text x="50%" y="92%" font-family="sans-serif" font-size="${Math.min(width, height) / 9}" fill="#ffffff" text-anchor="middle">${label}</text>` +
    "</svg>";
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const SAMPLE_IMAGES = {
  portrait: sampleImage(600, 900, "staand"),
  landscape: sampleImage(1200, 600, "liggend"),
  square: sampleImage(800, 800, "vierkant"),
};

/** One card per type, in the draft order of DOC_GAME_DESIGN.md § 4. */
export const SAMPLE_CARDS: GameCardProps[] = [
  {
    type: "viral",
    title: "Woedende livestream",
    image: {
      src: SAMPLE_IMAGES.landscape,
      alt: "Iemand schreeuwt in een livestream",
      focalPoint: { x: 70, y: 30 },
    },
    effects: [
      { meter: "users", delta: 12 },
      { meter: "reputation", delta: -3 },
    ],
    flavor: "Twee miljoen kijkers, nul feiten.",
  },
  {
    type: "ad",
    title: "Gok-app promo",
    image: {
      src: SAMPLE_IMAGES.portrait,
      alt: "Telefoon met een gokspel en munten",
      focalPoint: { x: 70, y: 30 },
    },
    effects: [
      { meter: "revenue", delta: 15 },
      { meter: "users", delta: -2 },
    ],
    flavor: "Cha-ching!",
  },
  {
    type: "news",
    title: "Klimaatakkoord ondertekend",
    image: { src: SAMPLE_IMAGES.square, alt: "Ondertekening van een akkoord" },
    effects: [
      { meter: "reputation", delta: 8 },
      { meter: "users", delta: -4 },
      { meter: "revenue", delta: 0 },
    ],
    flavor: "Een droge tik. Niemand deelt het.",
  },
  {
    type: "event",
    title: "EU-boete voor desinformatie",
    effects: [
      { meter: "reputation", delta: -15 },
      { meter: "revenue", delta: -10 },
    ],
    flavor: "De rekening van al die virale ophef komt in één keer.",
  },
];
