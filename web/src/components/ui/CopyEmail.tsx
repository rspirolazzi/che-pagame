"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Icon } from "./Icon";

/**
 * The contact email as selectable text, a "Copiar" button and a mailto link (FR-008c). Copying
 * falls back to selecting the text when the clipboard is not available.
 */
export function CopyEmail({ email }: { email: string }) {
  const t = useTranslations("pages.contact");
  const [copied, setCopied] = useState(false);
  const text = useRef<HTMLSpanElement>(null);

  function select() {
    const node = text.current;
    const selection = window.getSelection();
    if (!node || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    } catch {
      select();
    }
  }

  return (
    <div className="stack">
      <span ref={text} className="contact-email">
        {email}
      </span>
      <div className="row">
        <button type="button" className="secondary" onClick={copy}>
          <Icon name="copy" />
          {t("copy")}
        </button>
        <a className="button" href={`mailto:${email}`}>
          <Icon name="mail" />
          {t("write")}
        </a>
      </div>
      {copied && <p role="status">{t("copied")}</p>}
    </div>
  );
}
