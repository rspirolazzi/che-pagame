import { screen } from "@testing-library/react";

import { DonateSection } from "@/components/donate/DonateSection";

import { renderWithIntl } from "../support/render";

const URL = "https://cafecito.app/chepagame";

it("links to the donation page in a new tab without sending the referrer (FR-003)", () => {
  renderWithIntl(<DonateSection url={URL} />);
  expect(screen.getByRole("heading", { name: "Apoyá ChePagame" })).toBeInTheDocument();
  const link = screen.getByRole("link", {
    name: "Apoyá ChePagame (se abre en una pestaña nueva)",
  });
  expect(link).toHaveAttribute("href", URL);
  expect(link).toHaveAttribute("target", "_blank");
  expect(link.getAttribute("rel")).toEqual(expect.stringContaining("noopener"));
  expect(link.getAttribute("rel")).toEqual(expect.stringContaining("noreferrer"));
  expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
});

it("renders nothing without a link (FR-002)", () => {
  const { container } = renderWithIntl(<DonateSection url={null} />);
  expect(container).toBeEmptyDOMElement();
});

it("uses English texts", () => {
  renderWithIntl(<DonateSection url={URL} />, { locale: "en" });
  expect(screen.getByRole("link", { name: /Support ChePagame/ })).toBeInTheDocument();
});
