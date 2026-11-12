import { tokens } from "@/theme/tokens.generated";

type Hex = `#${string}`;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: Hex): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.x contrast ratio between two colors. */
function contrast(a: Hex, b: Hex): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

it("every declared pair meets its minimum contrast in both modes (SC-001)", () => {
  const failures: string[] = [];
  for (const mode of ["light", "dark"] as const) {
    const colors = tokens.color[mode] as Record<string, Hex>;
    for (const pair of tokens.contrastPairs) {
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

it("declares text pairs at 4.5:1 and control pairs at 3:1", () => {
  expect(tokens.contrastPairs.length).toBeGreaterThanOrEqual(16);
  const controlPairs = tokens.contrastPairs.filter((pair) => pair.foreground === "controlBorder");
  expect(controlPairs.map((pair) => pair.minimum)).toEqual([3, 3]);
});
