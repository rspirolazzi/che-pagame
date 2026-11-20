"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useRef, useState } from "react";

import { sendContactAction } from "@/app/actions/contact";
import type { ApiErrorCode } from "@/lib/api/errors";
import { validateEmail } from "@/lib/validation";

import { ErrorMessage } from "./FormMessage";
import { TurnstileWidget } from "./TurnstileWidget";

const NAME_MAX = 100;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;

type FieldError = "nameRequired" | "emailInvalid" | "messageTooShort" | "consentRequired";

interface ContactFormProps {
  /** Turnstile key in production; null elsewhere (no check is shown). */
  siteKey: string | null;
  /** Contact email offered when the message cannot be sent. */
  fallbackEmail: string | null;
  /** Name and email of the signed-in user, editable (FR-010). */
  defaults?: { name: string; email: string };
}

/**
 * Contact form (feature 017, US1): name, email, message and explicit consent to relay it through
 * CallMeBot (FR-013). What was typed is kept when sending fails.
 */
export function ContactForm({ siteKey, fallbackEmail, defaults }: ContactFormProps) {
  const t = useTranslations("contact");
  const [name, setName] = useState(defaults?.name ?? "");
  const [email, setEmail] = useState(defaults?.email ?? "");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<FieldError | null>(null);
  const [error, setError] = useState<ApiErrorCode | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const sending = useRef(false);

  function validate(): FieldError | null {
    if (!name.trim()) return "nameRequired";
    if (validateEmail(email)) return "emailInvalid";
    if (message.trim().length < MESSAGE_MIN) return "messageTooShort";
    if (!consent) return "consentRequired";
    return null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending.current) return;
    const problem = validate();
    setFieldError(problem);
    setError(null);
    if (problem) return;
    sending.current = true;
    setPending(true);
    const result = await sendContactAction({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      consent,
      turnstileToken: token,
    });
    sending.current = false;
    setPending(false);
    if (result.ok) {
      setSent(true);
      return;
    }
    setError(result.code);
    // A used token is no good for a retry.
    setToken(null);
  }

  if (sent) {
    return (
      <p role="status" className="form-status">
        {t("form.sent")}
      </p>
    );
  }

  const waitingForCheck = siteKey !== null && token === null;
  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="contact-name">{t("form.name")}</label>
        <input
          id="contact-name"
          autoComplete="name"
          maxLength={NAME_MAX}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="contact-email">{t("form.email")}</label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="contact-message">{t("form.message")}</label>
        <textarea
          id="contact-message"
          maxLength={MESSAGE_MAX}
          rows={6}
          value={message}
          aria-describedby="contact-message-count"
          onChange={(e) => setMessage(e.target.value)}
        />
        <small id="contact-message-count">
          {t("form.remaining", { count: MESSAGE_MAX - message.length })}
        </small>
      </div>
      <label className="row">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{t("form.consent")}</span>
      </label>
      {siteKey && <TurnstileWidget siteKey={siteKey} onToken={setToken} />}
      {fieldError && (
        <p role="alert" className="form-error">
          {t(`form.errors.${fieldError}`)}
        </p>
      )}
      <ErrorMessage code={error} />
      {error === "contact_unavailable" && fallbackEmail && (
        <p>
          {t("form.fallback")} <a href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>
        </p>
      )}
      <button type="submit" disabled={pending || waitingForCheck}>
        {pending ? t("form.sending") : t("form.send")}
      </button>
      {waitingForCheck && <small>{t("form.waitingCheck")}</small>}
    </form>
  );
}
