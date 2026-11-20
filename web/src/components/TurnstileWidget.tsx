"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

/** Cloudflare's script, loaded only where the widget is shown (feature 017, research R6). */
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("no api"));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("script failed"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface TurnstileWidgetProps {
  siteKey: string;
  /** A fresh token, or null when it expired or failed. */
  onToken: (token: string | null) => void;
}

/**
 * The anti-bot check of the sign-up and contact forms, in the user's language and theme. Most
 * people never interact with it. When it cannot load, it says so and offers to retry.
 */
export function TurnstileWidget({ siteKey, onToken }: TurnstileWidgetProps) {
  const t = useTranslations("botCheck");
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const container = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;
    loadScript()
      .then((api) => {
        if (cancelled || !container.current) return;
        widgetId = api.render(container.current, {
          sitekey: siteKey,
          language: locale,
          theme: resolvedTheme === "dark" ? "dark" : "light",
          "refresh-expired": "auto",
          callback: (token: string) => {
            setFailed(false);
            onTokenRef.current(token);
          },
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => {
            setFailed(true);
            onTokenRef.current(null);
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, locale, resolvedTheme, attempt]);

  return (
    <div className="turnstile">
      <div ref={container} />
      {failed && (
        <p role="alert" className="form-error">
          {t("failed")}{" "}
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            {t("retry")}
          </button>
        </p>
      )}
    </div>
  );
}
