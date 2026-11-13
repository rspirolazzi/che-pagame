"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { Icon } from "./ui/Icon";

/**
 * Phone navigation (FR-005b): a bar with the logo and a "Menú" button that opens a panel with the
 * same destinations. Escape closes it and returns the focus to the button; choosing a destination
 * closes it too.
 */
export function CompactMenu({ logo, children }: { logo: ReactNode; children: ReactNode }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="compact-menu">
      <div className="compact-bar">
        {logo}
        <button
          ref={button}
          type="button"
          className="secondary"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <Icon name={open ? "close" : "menu"} />
          {open ? t("closeMenu") : t("menu")}
        </button>
      </div>
      <nav
        ref={panel}
        id={panelId}
        className="compact-panel"
        aria-label={t("main")}
        hidden={!open}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        {children}
      </nav>
    </div>
  );
}
