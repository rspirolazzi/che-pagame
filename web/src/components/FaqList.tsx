import type { FaqEntry } from "@/lib/structuredData";

/** Question ids per group, in display order. The App keeps the same list (feature 011, R7). */
export const FAQ_GROUPS = {
  basics: ["what", "free", "app"],
  accounts: ["create", "invite", "currency"],
  expenses: ["split", "cents", "who"],
  balances: ["owes", "settle", "income", "close"],
  privacy: ["data", "export", "delete"],
} as const;

export type FaqGroup = keyof typeof FAQ_GROUPS;

type Translate = (key: string) => string;

/** Every question and answer, in order, for the page and its FAQPage data. */
export function faqEntries(t: Translate): FaqEntry[] {
  return (Object.keys(FAQ_GROUPS) as FaqGroup[]).flatMap((group) =>
    FAQ_GROUPS[group].map((id) => ({
      question: t(`groups.${group}.items.${id}.q`),
      answer: t(`groups.${group}.items.${id}.a`),
    })),
  );
}

/** Grouped questions; <details> opens with the keyboard and screen readers without JavaScript. */
export function FaqList({ t }: { t: Translate }) {
  return (
    <div className="stack">
      {(Object.keys(FAQ_GROUPS) as FaqGroup[]).map((group) => (
        <section key={group} className="stack" aria-labelledby={`faq-${group}`}>
          <h2 id={`faq-${group}`}>{t(`groups.${group}.title`)}</h2>
          {FAQ_GROUPS[group].map((id) => (
            <details key={id} className="card faq-item">
              <summary>{t(`groups.${group}.items.${id}.q`)}</summary>
              <p>{t(`groups.${group}.items.${id}.a`)}</p>
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}
