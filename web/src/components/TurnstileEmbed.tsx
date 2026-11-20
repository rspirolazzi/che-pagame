"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { TurnstileWidget } from "./TurnstileWidget";

type EmbedMessage =
  { type: "token"; token: string | null } | { type: "expired" } | { type: "error" };

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

function post(message: EmbedMessage) {
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
}

/**
 * Covers the whole page (header and footer included) with the check, and hands the token to
 * the App. Outside production there is no check: it says so and sends a null token.
 */
export function TurnstileEmbed({ siteKey }: { siteKey: string | null }) {
  const t = useTranslations("botCheck");
  useEffect(() => {
    if (!siteKey) post({ type: "token", token: null });
  }, [siteKey]);
  return (
    <div className="turnstile-embed">
      {siteKey ? (
        <TurnstileWidget
          siteKey={siteKey}
          onToken={(token) => post(token ? { type: "token", token } : { type: "expired" })}
        />
      ) : (
        <p>{t("disabled")}</p>
      )}
    </div>
  );
}
