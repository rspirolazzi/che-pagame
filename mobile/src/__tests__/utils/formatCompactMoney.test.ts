import { readFileSync } from "node:fs";
import { join } from "node:path";

import { formatCompactMoney } from "@/utils/money";

interface CompactCase {
  amount: string;
  currency: string;
  decimals: number;
  locale: string;
  expected: string;
}

// Shared with the App (feature 016, R6): both must show the same text for the same amount.
const CASES: CompactCase[] = JSON.parse(
  readFileSync(join(__dirname, "../../../../test-vectors/compact-amounts.json"), "utf8"),
);

// ICU uses no-break or narrow spaces; the cases are written with plain ones.
const plain = (text: string) => text.replace(/[\u00a0\u202f]/g, " ");

it.each(CASES.map((c) => [`${c.amount} ${c.currency} ${c.locale}`, c] as const))("%s", (_n, c) => {
  expect(plain(formatCompactMoney(c.amount, c.currency, c.decimals, c.locale))).toBe(c.expected);
});
