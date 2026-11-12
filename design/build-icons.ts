// Generates the ChePagame logo (approved option "A. Tilde final") from design/tokens.json and the
// brand typeface: the SVG sources in design/logo/ and every PNG the app needs in
// mobile/assets/images/. Usage: node --experimental-strip-types design/build-icons.ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// @resvg/resvg-js is a dev dependency of the mobile project.
const require = createRequire(join(ROOT, "mobile", "package.json"));
const { Resvg } = require("@resvg/resvg-js") as typeof import("@resvg/resvg-js");

type Colors = Record<string, string>;
const tokens = JSON.parse(readFileSync(join(ROOT, "design", "tokens.json"), "utf8")) as {
  color: { light: Colors; dark: Colors };
  typography: { brandFamily: string; brandWeights: { bold: string } };
};
const FAMILY = tokens.typography.brandFamily;
const FONT_FILE = join(ROOT, "mobile", "assets", "fonts", `${tokens.typography.brandWeights.bold}.ttf`);
const LOGO_DIR = join(ROOT, "design", "logo");
const OUT = join(ROOT, "mobile", "assets", "images");

const fontOptions = { fontFiles: [FONT_FILE], loadSystemFonts: false, defaultFontFamily: FAMILY };

/** Bounding box of the drawn content of an SVG, measured with the real font. */
function bbox(svg: string) {
  const box = new Resvg(svg, { font: fontOptions }).getBBox();
  if (!box) throw new Error("empty drawing");
  return box;
}

function png(svg: string, width: number): Buffer {
  return new Resvg(svg, { font: fontOptions, fitTo: { mode: "width", value: width } })
    .render()
    .asPng();
}

/** The "saldado" check in a 24-unit box (same path as the mockup). */
function tick(x: number, y: number, size: number, color: string, stroke = 4): string {
  const k = size / 24;
  return (
    `<path d="M3.5 12.5l5.5 5.5L20.5 5.5" transform="translate(${x} ${y}) scale(${k})" ` +
    `fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" ` +
    `stroke-linejoin="round"/>`
  );
}

const FS = 100; // font size the drawings are composed at; PNGs are scaled from the SVG.

/** "ChePagame" with "Che" in primary, "Pagame" in text color and the sun check at the end. */
function wordmark(mode: "light" | "dark"): string {
  const c = tokens.color[mode];
  const text = (che: string, rest: string) =>
    `<text x="0" y="${FS}" font-family="${FAMILY}" font-weight="700" font-size="${FS}" ` +
    `letter-spacing="-1.5"><tspan fill="${che}">Che</tspan><tspan fill="${rest}">Pagame</tspan></text>`;
  const probe = `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="300">${text(c.primary, c.text)}</svg>`;
  const box = bbox(probe);
  const size = FS * 0.62;
  const tickX = box.x + box.width + FS * 0.06;
  const tickY = box.y - FS * 0.12;
  const pad = FS * 0.08;
  const minX = box.x - pad;
  const minY = Math.min(box.y, tickY) - pad;
  const width = tickX + size + pad - minX;
  const height = box.y + box.height + pad - minY;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" ` +
    `width="${Math.round(width)}" height="${Math.round(height)}">` +
    `<title>ChePagame</title>${text(c.primary, c.text)}${tick(tickX, tickY, size, c.accent)}</svg>`
  );
}

/**
 * The app icon: "Che" centered with the check above its right side, in a square of `side`.
 * `background` null draws only the mark (adaptive foreground and monochrome).
 */
function iconMark(side: number, markWidth: number, ink: string, check: string, background: string | null) {
  const text = `<text x="0" y="${FS}" font-family="${FAMILY}" font-weight="700" font-size="${FS}" letter-spacing="-2" fill="${ink}">Che</text>`;
  const box = bbox(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="300">${text}</svg>`);
  const k = markWidth / box.width;
  const size = FS * 0.58;
  // Check sits up and to the right of the word; the group is centered as a whole.
  const tickX = box.x + box.width - size * 0.25;
  const tickY = box.y - size * 0.95;
  const groupW = tickX + size - box.x;
  const groupTop = tickY;
  const groupH = box.y + box.height - groupTop;
  const tx = (side - groupW * k) / 2 - box.x * k;
  const ty = (side - groupH * k) / 2 - groupTop * k;
  const bg = background ? `<rect width="${side}" height="${side}" fill="${background}"/>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${side}" height="${side}">` +
    `<title>ChePagame</title>${bg}<g transform="translate(${tx} ${ty}) scale(${k})">` +
    `${text}${tick(tickX, tickY, size, check, 5)}</g></svg>`
  );
}

function write(path: string, content: string | Buffer) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  console.log(`wrote ${path.slice(ROOT.length + 1).replaceAll("\\", "/")}`);
}

const light = tokens.color.light;
const dark = tokens.color.dark;

// SVG sources (kept in the repository as the logo of record).
const wordLight = wordmark("light");
const wordDark = wordmark("dark");
const symbol = iconMark(1024, 600, light.onPrimary, light.accent, light.primary);
write(join(LOGO_DIR, "wordmark-light.svg"), wordLight);
write(join(LOGO_DIR, "wordmark-dark.svg"), wordDark);
write(join(LOGO_DIR, "symbol.svg"), symbol);

// App icon (iOS and the store): full square, the OS rounds the corners.
write(join(OUT, "icon.png"), png(symbol, 1024));
// Android adaptive icon: 432 px layers; the mark stays inside the 66% safe zone.
write(
  join(OUT, "android-icon-background.png"),
  png(`<svg xmlns="http://www.w3.org/2000/svg" width="432" height="432"><rect width="432" height="432" fill="${light.primary}"/></svg>`, 432),
);
write(join(OUT, "android-icon-foreground.png"), png(iconMark(432, 200, light.onPrimary, light.accent, null), 432));
// Themed (monochrome) icon: Android tints the alpha, so one opaque color is enough.
write(join(OUT, "android-icon-monochrome.png"), png(iconMark(432, 200, light.text, light.text, null), 432));
// Splash: the icon tile on the brand background (light and dark variants share the image).
write(join(OUT, "splash-icon.png"), png(iconMark(512, 300, light.onPrimary, light.accent, light.primary), 512));
// In-app logo for the login, at 1x, 2x and 3x (React Native picks the density).
for (const [scale, suffix] of [[1, ""], [2, "@2x"], [3, "@3x"]] as const) {
  write(join(OUT, `logo-light${suffix}.png`), png(wordLight, 220 * scale));
  write(join(OUT, `logo-dark${suffix}.png`), png(wordDark, 220 * scale));
}
