"use client";

import { useTranslations } from "next-intl";

import type { ApiErrorCode } from "@/lib/api/errors";

import { StatusNotice } from "./ui/StatusNotice";

export function ErrorMessage({ code }: { code: ApiErrorCode | null | undefined }) {
  const t = useTranslations("errors");
  if (!code) return null;
  // Errors read with an icon and words, not only red text (feature 007, FR-010).
  return <StatusNotice kind="error">{t.has(code) ? t(code) : t("internal_error")}</StatusNotice>;
}

export function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="form-status">
      {children}
    </p>
  );
}
