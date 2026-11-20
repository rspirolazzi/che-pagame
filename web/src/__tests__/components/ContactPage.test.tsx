import { screen } from "@testing-library/react";

import { ContactContent } from "@/components/ContactContent";

import { renderWithIntl } from "../support/render";

it("shows the configured email with copy and write actions (FR-008c)", () => {
  renderWithIntl(<ContactContent email="hola@example.com" />);
  expect(screen.getByRole("heading", { name: "Contacto" })).toBeInTheDocument();
  expect(screen.getByText("hola@example.com")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Copiar/ })).toBeInTheDocument();
});

it("shows a neutral text, never an empty address, without CONTACT_EMAIL", () => {
  renderWithIntl(<ContactContent email={null} />);
  expect(screen.getByText("Pronto vas a poder escribirnos desde acá.")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Escribinos/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Copiar/ })).not.toBeInTheDocument();
});

it("points to the FAQ for common questions (feature 011)", () => {
  renderWithIntl(<ContactContent email={null} />);
  expect(screen.getByRole("link", { name: /preguntas frecuentes/ })).toHaveAttribute(
    "href",
    "/faq",
  );
});
