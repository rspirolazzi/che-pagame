import { screen } from "@testing-library/react";

import { LegalPage } from "@/components/LegalPage";
import { SiteFooter } from "@/components/SiteFooter";

import { renderWithIntl } from "../support/render";

jest.mock("@/app/actions/auth", () => ({ signOutAction: jest.fn() }));

it("the footer links to the public deletion page (feature 015)", () => {
  renderWithIntl(<SiteFooter />);
  expect(screen.getByRole("link", { name: "Eliminar mi cuenta" })).toHaveAttribute(
    "href",
    "/delete-account",
  );
});

it("the privacy page explains how to delete your data", () => {
  renderWithIntl(<LegalPage kind="privacy" />);
  expect(screen.getByRole("heading", { name: "Eliminar tus datos" })).toBeInTheDocument();
  expect(screen.getByText(/chepagame.com.ar\/delete-account/)).toBeInTheDocument();
  expect(screen.getByText(/18 de noviembre de 2026/)).toBeInTheDocument();
});
