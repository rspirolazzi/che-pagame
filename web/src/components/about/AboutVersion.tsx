"use client";

import { useTranslations } from "next-intl";

import type { BuildInfo } from "@/lib/buildInfo";

/** The running version on "Quiénes somos" (feature 009, FR-007); the commit is in the title. */
export function AboutVersion({ build }: { build: BuildInfo }) {
  const t = useTranslations("pages.about");
  const text = build.buildNumber
    ? t("versionBuild", { version: build.version, build: build.buildNumber })
    : t("version", { version: build.version });
  return <small title={build.commit ?? undefined}>{text}</small>;
}
