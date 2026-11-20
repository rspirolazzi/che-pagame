import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { sendContactAction } from "@/app/actions/contact";
import { ContactForm } from "@/components/ContactForm";
import { TurnstileEmbed } from "@/components/TurnstileEmbed";

import { messages, renderWithIntl } from "../support/render";

jest.mock("@/app/actions/contact", () => ({ sendContactAction: jest.fn() }));
jest.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light" }) }));
// The real widget loads Cloudflare's script; here it hands a token at once.
jest.mock("@/components/TurnstileWidget", () => ({
  TurnstileWidget: ({ onToken }: { onToken: (token: string) => void }) => (
    <button type="button" onClick={() => onToken("token-1")}>
      check
    </button>
  ),
}));

const send = sendContactAction as jest.Mock;

beforeEach(() => jest.clearAllMocks());

async function fill() {
  await userEvent.type(screen.getByLabelText("Nombre"), "Ana");
  await userEvent.type(screen.getByLabelText("Email"), "ana@mail.com");
  await userEvent.type(screen.getByLabelText("Mensaje"), "Hola, tengo una idea.");
}

it("validates every field and requires explicit consent (feature 017, FR-013)", async () => {
  renderWithIntl(<ContactForm siteKey={null} fallbackEmail={null} />);
  const consent = screen.getByRole("checkbox", { name: /CallMeBot/ });
  expect(consent).not.toBeChecked();
  await userEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Ingresá tu nombre");
  await fill();
  await userEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
  expect(screen.getByRole("alert")).toHaveTextContent("aceptá que se envíe por WhatsApp");
  expect(send).not.toHaveBeenCalled();
});

it("shows the characters left", async () => {
  renderWithIntl(<ContactForm siteKey={null} fallbackEmail={null} />);
  await userEvent.type(screen.getByLabelText("Mensaje"), "Hola");
  expect(screen.getByText("Te quedan 1996 caracteres")).toBeInTheDocument();
});

it("sends once and shows Mensaje enviado", async () => {
  send.mockResolvedValue({ ok: true });
  renderWithIntl(<ContactForm siteKey={null} fallbackEmail={null} />);
  await fill();
  await userEvent.click(screen.getByRole("checkbox", { name: /CallMeBot/ }));
  await userEvent.dblClick(screen.getByRole("button", { name: "Enviar mensaje" }));
  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith({
    name: "Ana",
    email: "ana@mail.com",
    message: "Hola, tengo una idea.",
    consent: true,
    turnstileToken: null,
  });
  expect(await screen.findByRole("status")).toHaveTextContent("Mensaje enviado");
});

it("waits for the anti-bot check in production and sends its token", async () => {
  send.mockResolvedValue({ ok: true });
  renderWithIntl(<ContactForm siteKey="site-key" fallbackEmail={null} />);
  await fill();
  await userEvent.click(screen.getByRole("checkbox", { name: /CallMeBot/ }));
  expect(screen.getByRole("button", { name: "Enviar mensaje" })).toBeDisabled();
  await userEvent.click(screen.getByRole("button", { name: "check" }));
  await userEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
  expect(send).toHaveBeenCalledWith(expect.objectContaining({ turnstileToken: "token-1" }));
});

it("keeps what was typed and offers the email when sending fails", async () => {
  send.mockResolvedValue({ ok: false, code: "contact_unavailable" });
  renderWithIntl(<ContactForm siteKey={null} fallbackEmail="hola@example.com" />);
  await fill();
  await userEvent.click(screen.getByRole("checkbox", { name: /CallMeBot/ }));
  await userEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
  expect(await screen.findByRole("link", { name: "hola@example.com" })).toHaveAttribute(
    "href",
    "mailto:hola@example.com",
  );
  expect(screen.getByLabelText("Mensaje")).toHaveValue("Hola, tengo una idea.");
});

it("comes with the signed-in user's name and email (FR-010)", () => {
  renderWithIntl(
    <ContactForm
      siteKey={null}
      fallbackEmail={null}
      defaults={{ name: "Ana García", email: "ana@mail.com" }}
    />,
  );
  expect(screen.getByLabelText("Nombre")).toHaveValue("Ana García");
  expect(screen.getByLabelText("Email")).toHaveValue("ana@mail.com");
});

it("the App's embed sends a null token outside production", () => {
  const postMessage = jest.fn();
  window.ReactNativeWebView = { postMessage };
  render(
    <IntlWrapper>
      <TurnstileEmbed siteKey={null} />
    </IntlWrapper>,
  );
  expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ type: "token", token: null }));
  delete window.ReactNativeWebView;
});

function IntlWrapper({ children }: { children: React.ReactNode }) {
  const { NextIntlClientProvider } = jest.requireActual("next-intl");
  return (
    <NextIntlClientProvider locale="es" messages={messages.es} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
}
