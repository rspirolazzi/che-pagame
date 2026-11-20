import { screen } from "@testing-library/react";
import { useTranslations } from "next-intl";

import { FAQ_GROUPS, faqEntries, FaqList } from "@/components/FaqList";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import { faqPageJsonLd } from "@/lib/structuredData";

import { renderWithIntl } from "../support/render";

function Faq() {
  const t = useTranslations("pages.faq");
  return <FaqList t={t} />;
}

it("shows the questions grouped, each one in an expandable <details> (US2)", () => {
  const { container } = renderWithIntl(<Faq />);
  expect(screen.getByRole("heading", { level: 2, name: "Lo básico" })).toBeInTheDocument();
  expect(screen.getByText("¿Es gratis?")).toBeInTheDocument();
  const details = container.querySelectorAll("details");
  expect(details.length).toBeGreaterThanOrEqual(12);
  details.forEach((item) => expect(item.querySelector("summary")).not.toBeNull());
});

it("marks up the same questions and answers that are visible (FR-009)", () => {
  const { container } = renderWithIntl(<Faq />);
  const t = (key: string) =>
    key
      .split(".")
      .reduce<unknown>(
        (node, part) => (node as Record<string, unknown>)[part],
        es.pages.faq,
      ) as string;
  const data = faqPageJsonLd(faqEntries(t));
  const summaries = [...container.querySelectorAll("summary")].map((s) => s.textContent);
  expect(data.mainEntity.map((q) => q.name)).toEqual(summaries);
});

it.each([
  ["es", es],
  ["en", en],
])("every question id has a question and an answer in %s", (_lang, messages) => {
  const groups = messages.pages.faq.groups as Record<
    string,
    { title: string; items: Record<string, { q: string; a: string }> }
  >;
  for (const [group, ids] of Object.entries(FAQ_GROUPS)) {
    for (const id of ids) {
      expect(groups[group].items[id].q).toBeTruthy();
      expect(groups[group].items[id].a).toBeTruthy();
    }
  }
});
