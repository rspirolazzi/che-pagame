import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fromMinor, splitEqual, toMinor } from "@/lib/money";

interface SplitCase {
  name: string;
  amount: string;
  decimals: number;
  accountOrder: string[];
  selected: string[];
  expected: Record<string, string>;
}

// Shared with the backend and the App (feature 013, R3): the three must agree on every share.
const CASES: SplitCase[] = JSON.parse(
  readFileSync(join(__dirname, "../../../../test-vectors/split-equal.json"), "utf8"),
);

it.each(CASES.map((c) => [c.name, c] as const))("%s", (_name, c) => {
  const shares = splitEqual(c.amount, c.decimals, c.selected, c.accountOrder);
  expect(Object.fromEntries(shares)).toEqual(c.expected);
  const sum = [...shares.values()].reduce(
    (acc, value) => acc + toMinor(value, c.decimals),
    BigInt(0),
  );
  expect(sum).toBe(toMinor(c.amount, c.decimals));
});

it("converts decimal text to minor units and back", () => {
  expect(toMinor("100.50", 2)).toBe(BigInt(10050));
  expect(toMinor("10.5", 2)).toBe(BigInt(1050));
  expect(toMinor("100", 0)).toBe(BigInt(100));
  expect(toMinor("1.001", 3)).toBe(BigInt(1001));
  expect(fromMinor(BigInt(3334), 2)).toBe("33.34");
  expect(fromMinor(BigInt(5), 2)).toBe("0.05");
  expect(fromMinor(BigInt(34), 0)).toBe("34");
  expect(fromMinor(BigInt(999999999999), 3)).toBe("999999999.999");
});

it("returns no shares when nobody is selected", () => {
  expect(splitEqual("100.00", 2, [], ["a"]).size).toBe(0);
});
