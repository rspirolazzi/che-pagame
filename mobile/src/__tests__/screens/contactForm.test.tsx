import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { useAuth } from "@/hooks/useAuth";
import i18n from "@/i18n";
import { ContactForm } from "@/screens/about/ContactForm";
import { contactApi, publicConfigApi } from "@/services/api/contact";
import { ApiError } from "@/services/api/types";

import { renderScreen, user } from "../support/render";

jest.mock("@/hooks/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("@/services/api/contact", () => ({
  contactApi: { send: jest.fn() },
  publicConfigApi: { get: jest.fn() },
}));

const send = contactApi.send as jest.Mock;
const config = publicConfigApi.get as jest.Mock;

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage("es");
  (useAuth as jest.Mock).mockReturnValue({ user: null });
  config.mockResolvedValue({ turnstileSiteKey: null });
});

function fill() {
  fireEvent.changeText(screen.getByLabelText("Nombre"), "Ana");
  fireEvent.changeText(screen.getByLabelText("Email"), "ana@mail.com");
  fireEvent.changeText(screen.getByLabelText("Mensaje"), "Hola, tengo una idea.");
}

it("requires explicit consent before sending (feature 017, FR-013)", async () => {
  renderScreen(<ContactForm />);
  fill();
  fireEvent.press(screen.getByText("Enviar mensaje"));
  expect(await screen.findByText(/aceptá que se envíe por WhatsApp/)).toBeOnTheScreen();
  expect(send).not.toHaveBeenCalled();
});

it("sends the message and shows Mensaje enviado", async () => {
  send.mockResolvedValue(undefined);
  renderScreen(<ContactForm />);
  fill();
  fireEvent.press(screen.getByRole("checkbox", { name: /CallMeBot/ }));
  fireEvent.press(screen.getByText("Enviar mensaje"));
  await waitFor(() =>
    expect(send).toHaveBeenCalledWith({
      name: "Ana",
      email: "ana@mail.com",
      message: "Hola, tengo una idea.",
      language: "es",
      consent: true,
      turnstileToken: null,
    }),
  );
  expect(await screen.findByText(/Mensaje enviado/)).toBeOnTheScreen();
});

it("keeps what was typed when sending fails", async () => {
  send.mockRejectedValue(new ApiError(502, "contact_unavailable"));
  renderScreen(<ContactForm />);
  fill();
  fireEvent.press(screen.getByRole("checkbox", { name: /CallMeBot/ }));
  fireEvent.press(screen.getByText("Enviar mensaje"));
  expect(await screen.findByText(/No pudimos enviar tu mensaje/)).toBeOnTheScreen();
  expect(screen.getByLabelText("Mensaje").props.value).toBe("Hola, tengo una idea.");
});

it("comes with the profile's name and email (FR-010)", () => {
  (useAuth as jest.Mock).mockReturnValue({ user });
  renderScreen(<ContactForm />);
  expect(screen.getByLabelText("Email").props.value).toBe(user.email);
});

it("waits for the anti-bot check when the API asks for it", async () => {
  config.mockResolvedValue({ turnstileSiteKey: "site-key" });
  renderScreen(<ContactForm />);
  fill();
  fireEvent.press(screen.getByRole("checkbox", { name: /CallMeBot/ }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Enviar mensaje" })).toBeDisabled(),
  );
});
