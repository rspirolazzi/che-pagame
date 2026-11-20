/**
 * Exact money in the client (Principle III, research R1). Amounts travel as decimal text
 * ("100.50"); this module never turns them into a JavaScript number to compute with.
 */

export const MAX_MAJOR_AMOUNT = "999999999";

export type AmountError =
  | "amountEmpty"
  | "amountInvalid"
  | "amountTooManyDecimals"
  | "amountNotPositive"
  | "amountTooLarge";

export type ParsedAmount = { ok: true; value: string } | { ok: false; error: AmountError };

function separators(locale: string): { group: string; decimal: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    group: parts.find((p) => p.type === "group")?.value ?? ",",
    decimal: parts.find((p) => p.type === "decimal")?.value ?? ".",
  };
}

/**
 * What the user typed, in their language ("1.234,50" in es, "1,234.50" in en), to the API's
 * decimal text ("1234.50"). A lone separator followed by digits is read as decimal either way
 * ("100,5" and "100.5") unless it is clearly a thousands group of the locale.
 */
export function parseAmountInput(text: string, locale: string, decimals: number): ParsedAmount {
  const raw = text.replace(/\s/g, "");
  if (!raw) return { ok: false, error: "amountEmpty" };
  if (raw.startsWith("-")) return { ok: false, error: "amountNotPositive" };
  if (!/^[\d.,']+$/.test(raw)) return { ok: false, error: "amountInvalid" };

  const { group, decimal } = separators(locale);
  let normalized: string;
  const lastSep = Math.max(raw.lastIndexOf("."), raw.lastIndexOf(","));
  if (lastSep === -1) {
    normalized = raw;
  } else {
    const sepChar = raw[lastSep];
    const intPart = raw.slice(0, lastSep);
    const fraction = raw.slice(lastSep + 1);
    const looksLikeGroup =
      sepChar === group && sepChar !== decimal && fraction.length === 3 && !/[.,]/.test(fraction);
    if (looksLikeGroup && decimals !== 3) {
      normalized = raw.split(sepChar).join("");
    } else {
      // The decimal separator can only appear once.
      if (intPart.includes(sepChar)) return { ok: false, error: "amountInvalid" };
      normalized = `${intPart.replace(/[.,']/g, "")}.${fraction}`;
    }
  }
  normalized = normalized.replace(/'/g, "");
  if (!/^\d*(\.\d*)?$/.test(normalized) || normalized === "." || normalized === "") {
    return { ok: false, error: "amountInvalid" };
  }

  let [whole, fraction = ""] = normalized.split(".");
  whole = whole.replace(/^0+(?=\d)/, "") || "0";
  fraction = fraction.replace(/0+$/, "");
  if (fraction.length > decimals) return { ok: false, error: "amountTooManyDecimals" };
  if (/^0*$/.test(whole) && /^0*$/.test(fraction)) return { ok: false, error: "amountNotPositive" };
  if (
    whole.length > MAX_MAJOR_AMOUNT.length ||
    (whole.length === MAX_MAJOR_AMOUNT.length && whole > MAX_MAJOR_AMOUNT)
  ) {
    return { ok: false, error: "amountTooLarge" };
  }
  return { ok: true, value: decimals === 0 ? whole : `${whole}.${fraction.padEnd(decimals, "0")}` };
}

/** The API's decimal text back into what the user would type in their language. */
export function amountToInput(amount: string, locale: string): string {
  const { decimal } = separators(locale);
  return amount.replace(".", decimal);
}

/**
 * Formats decimal text with the currency of the account. Intl accepts the string as is, so no
 * precision is lost on the way.
 */
export function formatMoney(
  amount: string,
  currency: string,
  decimals: number,
  locale: string,
): string {
  const format = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format as (value: string) => string;
  return format(amount);
}

const TEN = BigInt(10);

/** Decimal text from the API or parseAmountInput ("100.50") to minor units as a bigint. */
export function toMinor(amount: string, decimals: number): bigint {
  const [whole, fraction = ""] = amount.replace(/^-/, "").split(".");
  const minor =
    BigInt(whole || "0") * TEN ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0").slice(0, decimals) || "0");
  return amount.startsWith("-") ? -minor : minor;
}

/** Minor units back to decimal text with exactly `decimals` digits ("33.34"). */
export function fromMinor(minor: bigint, decimals: number): string {
  const negative = minor < BigInt(0);
  const digits = (negative ? -minor : minor).toString();
  if (decimals === 0) return `${negative ? "-" : ""}${digits}`;
  const padded = digits.padStart(decimals + 1, "0");
  return `${negative ? "-" : ""}${padded.slice(0, -decimals)}.${padded.slice(-decimals)}`;
}

/**
 * Equal shares exactly like the server's split_equal (feature 013, R1): ordered by the account's
 * participants, the leftover minor units go one by one to the first ones. The shares always add
 * up to the amount. Returns participant id → decimal text, in the account's order.
 */
export function splitEqual(
  amount: string,
  decimals: number,
  selected: string[],
  accountOrder: string[],
): Map<string, string> {
  const position = new Map(accountOrder.map((id, index) => [id, index]));
  const ordered = [...new Set(selected)].sort(
    (a, b) => (position.get(a) ?? accountOrder.length) - (position.get(b) ?? accountOrder.length),
  );
  const shares = new Map<string, string>();
  if (ordered.length === 0) return shares;
  const total = toMinor(amount, decimals);
  const count = BigInt(ordered.length);
  const quotient = total / count;
  const remainder = total % count;
  ordered.forEach((id, index) => {
    const extra = BigInt(index) < remainder ? BigInt(1) : BigInt(0);
    shares.set(id, fromMinor(quotient + extra, decimals));
  });
  return shares;
}

const HALF_UP_TWO = BigInt(2);
const THOUSAND = BigInt(1000);
const MILLION = BigInt(1000000);
const COMPACT_FROM = BigInt(10000);

/** Rounded tenths of `minor / divisor`, half up (1.25 → 13 tenths). */
function tenthsOf(minor: bigint, divisor: bigint): bigint {
  return (minor * TEN * HALF_UP_TWO + divisor) / (HALF_UP_TWO * divisor);
}

/**
 * A large amount with "K" (from 10,000) or "M" (from 1,000,000), at most one decimal and no
 * trailing zero, the currency where the language puts it: "25,5 K ARS", "ARS 10M" (feature 016).
 * Display only: below 10,000 it is formatMoney, and every calculation keeps the exact amount.
 */
export function formatCompactMoney(
  amount: string,
  currency: string,
  decimals: number,
  locale: string,
): string {
  const negative = amount.startsWith("-");
  const minor = toMinor(negative ? amount.slice(1) : amount, decimals);
  const unit = TEN ** BigInt(decimals);
  if (minor < COMPACT_FROM * unit) return formatMoney(amount, currency, decimals, locale);

  let suffix = "K";
  let tenths = tenthsOf(minor, unit * THOUSAND);
  // 999,950 rounds to 1.000,0 K: shown as 1 M instead.
  if (minor >= MILLION * unit || tenths >= THOUSAND * TEN) {
    suffix = "M";
    tenths = tenthsOf(minor, unit * MILLION);
  }
  const whole = tenths / TEN;
  const tenth = tenths % TEN;
  const text = `${negative ? "-" : ""}${whole}${tenth === BigInt(0) ? "" : `.${tenth}`}`;
  const format = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  const parts = (format.formatToParts as (value: string) => Intl.NumberFormatPart[])(text);
  const numeric = new Set(["integer", "group", "decimal", "fraction"]);
  const last = parts.reduce((found, part, index) => (numeric.has(part.type) ? index : found), -1);
  // Spanish separates the letter from the number ("10 M"); English does not ("10M").
  const gap = locale.startsWith("es") ? "\u00a0" : "";
  return parts
    .map((part, index) => (index === last ? `${part.value}${gap}${suffix}` : part.value))
    .join("");
}
