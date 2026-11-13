import { fireEvent, screen, waitFor } from "@testing-library/react";

import { CopyEmail } from "@/components/ui/CopyEmail";

import { renderWithIntl } from "../support/render";

const writeText = jest.fn();

beforeEach(() => {
  writeText.mockReset();
  Object.assign(navigator, { clipboard: { writeText } });
});

it("shows the email, copies it and links to the mail client (FR-008c)", async () => {
  writeText.mockResolvedValue(undefined);
  renderWithIntl(<CopyEmail email="hola@example.com" />);
  expect(screen.getByText("hola@example.com")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Escribinos/ })).toHaveAttribute(
    "href",
    "mailto:hola@example.com",
  );
  fireEvent.click(screen.getByRole("button", { name: /Copiar/ }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Copiado"));
  expect(writeText).toHaveBeenCalledWith("hola@example.com");
});

it("selects the text when the clipboard is not available", async () => {
  writeText.mockRejectedValue(new Error("denied"));
  renderWithIntl(<CopyEmail email="hola@example.com" />);
  fireEvent.click(screen.getByRole("button", { name: /Copiar/ }));
  await waitFor(() => expect(window.getSelection()?.toString()).toBe("hola@example.com"));
});
