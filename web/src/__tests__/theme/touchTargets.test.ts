/**
 * @jest-environment node
 */
import fs from "fs";
import path from "path";

const STYLES = path.resolve(__dirname, "../../styles");
const read = (file: string) => fs.readFileSync(path.join(STYLES, file), "utf8");

/** The declaration block of the first rule whose selector list contains `selector`. */
function block(css: string, selector: string): string {
  const start = css.indexOf(selector);
  expect(start).toBeGreaterThanOrEqual(0);
  return css.slice(css.indexOf("{", start), css.indexOf("}", start));
}

it("buttons are at least the identity touch target (FR-017)", () => {
  expect(block(read("components.css"), ".button {")).toContain(
    "min-height: var(--size-touch-target)",
  );
});

it("navigation links reach the touch target on phones (FR-017)", () => {
  const layout = read("layout.css");
  const phone = layout.slice(layout.indexOf("@media (max-width: 767px)"));
  expect(phone).toMatch(/\.compact-panel a[\s\S]*min-height: var\(--size-touch-target\)/);
  expect(block(layout, ".nav-link {")).toContain("min-height: var(--size-touch-target)");
});
