/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";

const SOURCE = path.resolve(__dirname, "../../../../design/tokens.json");
const GENERATED = path.resolve(__dirname, "../../styles/tokens.generated.css");

type Colors = Record<string, string>;
type Tokens = {
  color: { light: Colors; dark: Colors };
  contrastPairs: { foreground: string; background: string; minimum: number }[];
};

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

// design/ is not mounted in the web container: these checks run on the host.
const available = fs.existsSync(SOURCE);
const describeIfSource = available ? describe : describe.skip;
if (!available) {
  console.warn(`tokens.test: ${SOURCE} not found (run the Web tests on the host); skipping.`);
}

describeIfSource("design tokens in the Web", () => {
  const tokens = available ? (JSON.parse(fs.readFileSync(SOURCE, "utf8")) as Tokens) : null;
  const css = fs.readFileSync(GENERATED, "utf8");
  const darkBlock = css.slice(css.indexOf(':root[data-theme="dark"]'));

  it("the generated CSS matches design/tokens.json (run npm run tokens otherwise)", () => {
    const stale: string[] = [];
    for (const [role, value] of Object.entries(tokens!.color.light)) {
      if (!css.includes(`--color-${kebab(role)}: ${value};`)) stale.push(`light ${role}`);
    }
    for (const [role, value] of Object.entries(tokens!.color.dark)) {
      if (!darkBlock.includes(`--color-${kebab(role)}: ${value};`)) stale.push(`dark ${role}`);
    }
    expect(stale).toEqual([]);
  });

  it("every declared pair meets its minimum contrast in both modes (SC-001)", () => {
    const failures: string[] = [];
    for (const mode of ["light", "dark"] as const) {
      const colors = tokens!.color[mode];
      for (const pair of tokens!.contrastPairs) {
        const ratio = contrast(colors[pair.foreground], colors[pair.background]);
        if (ratio < pair.minimum) {
          failures.push(
            `${pair.foreground} on ${pair.background} (${mode}) is ${ratio.toFixed(2)}:1, ` +
              `minimum ${pair.minimum}:1`,
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
