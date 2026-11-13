/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";

const SRC = path.resolve(__dirname, "../..");
const SKIP = [path.join("styles", "tokens.generated.css"), "__tests__"];
const COLOR_LITERAL = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|\b(?:rgba?|hsla?)\(/;
// The sun accent is only a background for highlights, never a text color (FR-004).
const ACCENT_AS_TEXT = /(?:^|[\s;{])color\s*:\s*var\(--color-accent\)/;

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    const relative = path.relative(SRC, full);
    if (SKIP.some((skip) => relative === skip || relative.startsWith(skip + path.sep))) return [];
    if (entry.isDirectory()) return files(full);
    return /\.(ts|tsx|css)$/.test(entry.name) && !entry.name.endsWith(".d.ts") ? [full] : [];
  });
}

function findings(pattern: RegExp): string[] {
  return files(SRC).flatMap((file) =>
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .flatMap((line, index) =>
        pattern.test(line) ? [`${path.relative(SRC, file)}:${index + 1}: ${line.trim()}`] : [],
      ),
  );
}

it("pages, components and styles take colors only from the tokens (SC-002)", () => {
  expect(findings(COLOR_LITERAL)).toEqual([]);
});

it("never uses the accent as a text color (FR-004)", () => {
  expect(findings(ACCENT_AS_TEXT)).toEqual([]);
});
