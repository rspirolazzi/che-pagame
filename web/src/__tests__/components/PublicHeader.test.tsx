import { screen } from "@testing-library/react";

import { PublicHeader } from "@/components/PublicHeader";
import { SkipLink } from "@/components/SkipLink";

import { renderWithIntl } from "../support/render";

jest.mock("next/navigation", () => ({ usePathname: () => "/how-it-works" }));

it("shows the public navigation without a session (constitution v4.6.0)", () => {
  renderWithIntl(<PublicHeader />);
  for (const name of ["Inicio", "Cómo funciona", "Quiénes somos", "Contacto", "Login / Registro"]) {
    expect(screen.getAllByRole("link", { name }).length).toBeGreaterThan(0);
  }
  expect(screen.getAllByRole("link", { name: "ChePagame" })[0]).toHaveAttribute("href", "/");
});

it("marks the current page", () => {
  renderWithIntl(<PublicHeader />);
  expect(screen.getAllByRole("link", { name: "Cómo funciona" })[0]).toHaveAttribute(
    "aria-current",
    "page",
  );
});

it("the skip link jumps to the content (FR-016)", () => {
  renderWithIntl(
    <>
      <SkipLink />
      <PublicHeader />
    </>,
  );
  const links = screen.getAllByRole("link");
  expect(links[0]).toHaveTextContent("Saltar al contenido");
  expect(links[0]).toHaveAttribute("href", "#main");
});

it("uses English labels", () => {
  renderWithIntl(<PublicHeader />, { locale: "en" });
  expect(screen.getAllByRole("link", { name: "How it works" }).length).toBeGreaterThan(0);
});
