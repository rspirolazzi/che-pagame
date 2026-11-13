import { fireEvent, screen } from "@testing-library/react";
import Link from "next/link";

import { CompactMenu } from "@/components/CompactMenu";

import { renderWithIntl } from "../support/render";

function renderMenu() {
  renderWithIntl(
    <CompactMenu logo={<span>logo</span>}>
      <Link href="/dashboard">Inicio</Link>
      <Link href="/accounts">Cuentas</Link>
    </CompactMenu>,
  );
  return screen.getByRole("button", { name: "Menú" });
}

it("opens the panel with the button (FR-005b)", () => {
  const button = renderMenu();
  expect(button).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("link", { name: "Inicio" })).not.toBeInTheDocument();
  fireEvent.click(button);
  expect(screen.getByRole("button", { name: "Cerrar" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("link", { name: "Inicio" })).toHaveFocus();
});

it("closes with Escape and returns the focus to the button (FR-016)", () => {
  const button = renderMenu();
  fireEvent.click(button);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("link", { name: "Inicio" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Menú" })).toHaveFocus();
});

it("closes after choosing a destination", () => {
  fireEvent.click(renderMenu());
  fireEvent.click(screen.getByRole("link", { name: "Cuentas" }));
  expect(screen.queryByRole("link", { name: "Cuentas" })).not.toBeInTheDocument();
});
