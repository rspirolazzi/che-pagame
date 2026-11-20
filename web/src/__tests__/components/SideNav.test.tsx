import { fireEvent, screen } from "@testing-library/react";

import { signOutAction } from "@/app/actions/auth";
import { SideNav } from "@/components/SideNav";

import { renderWithIntl } from "../support/render";

jest.mock("@/app/actions/auth", () => ({ signOutAction: jest.fn() }));
jest.mock("next/navigation", () => ({
  usePathname: () => "/accounts/a1/balances",
  useRouter: () => ({ refresh: jest.fn() }),
}));
jest.mock("@/app/actions/preferences", () => ({
  setLanguageAction: jest.fn(),
  setThemeAction: jest.fn(),
}));

// Replaces the signed-in user menu checks of the old header (spec Clarifications, R13).
it("shows Inicio, Cuentas and Perfil with their destinations (FR-005a)", () => {
  renderWithIntl(<SideNav logo={null} />);
  expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/dashboard");
  expect(screen.getByRole("link", { name: "Cuentas" })).toHaveAttribute("href", "/accounts");
  expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute("href", "/profile");
});

it("marks the active destination with aria-current", () => {
  renderWithIntl(<SideNav logo={null} />);
  expect(screen.getByRole("link", { name: "Cuentas" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
});

it("keeps the information pages under Más", () => {
  renderWithIntl(<SideNav logo={null} />);
  expect(screen.getByText("Más")).toBeInTheDocument();
  for (const name of ["Cómo funciona", "Quiénes somos", "Contacto"]) {
    expect(screen.getByRole("link", { name })).toBeInTheDocument();
  }
});

it("signs out with Salir", () => {
  renderWithIntl(<SideNav logo={null} />);
  fireEvent.click(screen.getByRole("button", { name: "Salir" }));
  expect(signOutAction).toHaveBeenCalledTimes(1);
});
