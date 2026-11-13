import { render, screen } from "@testing-library/react";

import { Logo } from "@/components/ui/Logo";

it("links to the given page with the accessible name ChePagame (FR-006)", () => {
  render(<Logo href="/dashboard" />);
  const link = screen.getByRole("link", { name: "ChePagame" });
  expect(link).toHaveAttribute("href", "/dashboard");
  expect(link).toHaveTextContent("ChePagame");
  expect(link.querySelector(".logo-che")).toHaveTextContent("Che");
});
