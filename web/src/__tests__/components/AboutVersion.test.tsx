import { screen } from "@testing-library/react";

import { AboutVersion } from "@/components/about/AboutVersion";
import type { BuildInfo } from "@/lib/buildInfo";

import { renderWithIntl } from "../support/render";

const released: BuildInfo = {
  version: "0.1.0",
  buildNumber: "42",
  buildDate: "2026-11-13T18:40:00Z",
  releaseTag: "main-42",
  commit: "397655e",
};

const dev: BuildInfo = {
  version: "dev",
  buildNumber: null,
  buildDate: null,
  releaseTag: null,
  commit: null,
};

it("shows the version and build, with the commit for support (FR-007)", () => {
  renderWithIntl(<AboutVersion build={released} />);
  const line = screen.getByText("Versión 0.1.0 · build 42");
  expect(line).toHaveAttribute("title", "397655e");
});

it("shows only the version without a build", () => {
  renderWithIntl(<AboutVersion build={dev} />);
  const line = screen.getByText("Versión dev");
  expect(line).not.toHaveAttribute("title");
});

it("is translated to English", () => {
  renderWithIntl(<AboutVersion build={released} />, { locale: "en" });
  expect(screen.getByText("Version 0.1.0 · build 42")).toBeInTheDocument();
});
