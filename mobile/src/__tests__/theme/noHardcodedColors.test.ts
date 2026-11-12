import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../../..");
const SCAN = ["src", "app"];
const SKIP = [path.join("src", "theme"), path.join("src", "__tests__")];
const COLOR_LITERAL = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|\b(?:rgba?|hsla?)\(/;
// `accent` is only a background for highlights, never a text color (FR-017).
const ACCENT_AS_TEXT = /\b(?:color|textColor)\s*[:=]\s*\{?\s*[\w.]*\baccent\b/;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    const relative = path.relative(ROOT, full);
    if (SKIP.some((skip) => relative === skip || relative.startsWith(skip + path.sep))) return [];
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts") ? [full] : [];
  });
}

function findings(pattern: RegExp): string[] {
  return SCAN.flatMap((dir) => sourceFiles(path.join(ROOT, dir))).flatMap((file) =>
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .flatMap((line, index) =>
        pattern.test(line) ? [`${path.relative(ROOT, file)}:${index + 1}: ${line.trim()}`] : [],
      ),
  );
}

it("screens and components take colors only from the theme (SC-002)", () => {
  expect(findings(COLOR_LITERAL)).toEqual([]);
});

it("never uses the accent as a text color (FR-017)", () => {
  expect(findings(ACCENT_AS_TEXT)).toEqual([]);
});
