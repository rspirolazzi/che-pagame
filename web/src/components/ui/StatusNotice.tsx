"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Icon, type IconName } from "./Icon";

type Kind = "warning" | "error" | "readOnly" | "info";

const ICONS: Record<Kind, IconName> = {
  warning: "alert",
  error: "error",
  readOnly: "lock",
  info: "info",
};

/** A state shown with an icon, words and color, never color alone (FR-010). */
export function StatusNotice({
  kind,
  children,
  action,
}: {
  kind: Kind;
  children: ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  const t = useTranslations("a11y");
  return (
    <div className={`notice notice-${kind}`} role={kind === "error" ? "alert" : undefined}>
      <span className="notice-icon" role="img" aria-label={t(kind)}>
        <Icon name={ICONS[kind]} />
      </span>
      <div className="notice-body">
        <div>{children}</div>
        {action && (
          <button type="button" className="link-button" onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
