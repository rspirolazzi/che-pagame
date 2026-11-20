import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { confirmAccountDeletionAction, requestAccountDeletionAction } from "@/app/actions/profile";
import { DeleteAccountFlow } from "@/components/DeleteAccountFlow";

import { renderWithIntl } from "../support/render";

jest.mock("@/app/actions/profile", () => ({
  requestAccountDeletionAction: jest.fn(),
  confirmAccountDeletionAction: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

async function typeCode(code: string) {
  await userEvent.type(screen.getByLabelText("Código"), code);
}

it("explains what is erased and kept, and offers the export", () => {
  renderWithIntl(<DeleteAccountFlow email="beto@mail.com" />);
  expect(screen.getByRole("heading", { level: 1, name: "Eliminar mi cuenta" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Qué se borra" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Qué queda" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Exportar mis datos" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", "/profile");
});

it("asks for the code and confirms the deletion with it", async () => {
  (requestAccountDeletionAction as jest.Mock).mockResolvedValue({ ok: true });
  (confirmAccountDeletionAction as jest.Mock).mockResolvedValue({ ok: true });
  renderWithIntl(<DeleteAccountFlow email="beto@mail.com" />);
  await userEvent.click(screen.getByRole("button", { name: "Enviarme el código para eliminar" }));
  expect(requestAccountDeletionAction).toHaveBeenCalledTimes(1);
  expect(await screen.findByText(/Te enviamos un código a beto@mail.com/)).toBeInTheDocument();
  await typeCode("123456");
  expect(confirmAccountDeletionAction).toHaveBeenCalledWith("123456");
});

it("shows a wrong code and keeps the user on the code step", async () => {
  (requestAccountDeletionAction as jest.Mock).mockResolvedValue({ ok: true });
  (confirmAccountDeletionAction as jest.Mock).mockResolvedValue({
    ok: false,
    code: "invalid_code",
  });
  renderWithIntl(<DeleteAccountFlow email="beto@mail.com" />);
  await userEvent.click(screen.getByRole("button", { name: "Enviarme el código para eliminar" }));
  await typeCode("000000");
  expect(await screen.findByText(/El código es incorrecto o venció/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enviar otro código" })).toBeInTheDocument();
});

it("shows the rate limit when asking for a code too often", async () => {
  (requestAccountDeletionAction as jest.Mock).mockResolvedValue({
    ok: false,
    code: "rate_limited",
  });
  renderWithIntl(<DeleteAccountFlow email="beto@mail.com" />);
  await userEvent.click(screen.getByRole("button", { name: "Enviarme el código para eliminar" }));
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.queryByText(/Te enviamos un código/)).not.toBeInTheDocument();
});
