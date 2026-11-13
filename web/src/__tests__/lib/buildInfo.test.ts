import { getBuildInfo } from "@/lib/buildInfo";

const VARIABLES = ["APP_VERSION", "BUILD_NUMBER", "BUILD_DATE", "RELEASE_TAG", "GIT_SHA"];

beforeEach(() => {
  for (const name of VARIABLES) delete process.env[name];
});

it("reads the build variables baked into the image", () => {
  process.env.APP_VERSION = "0.1.0";
  process.env.BUILD_NUMBER = "42";
  process.env.BUILD_DATE = "2026-11-13T18:40:00Z";
  process.env.RELEASE_TAG = "main-42";
  process.env.GIT_SHA = "397655e";
  expect(getBuildInfo()).toEqual({
    version: "0.1.0",
    buildNumber: "42",
    buildDate: "2026-11-13T18:40:00Z",
    releaseTag: "main-42",
    commit: "397655e",
  });
});

it("reports dev without variables", () => {
  expect(getBuildInfo()).toEqual({
    version: "dev",
    buildNumber: null,
    buildDate: null,
    releaseTag: null,
    commit: null,
  });
});

it.each([
  ["GIT_SHA", "not-a-sha", "commit"],
  ["GIT_SHA", "abc12", "commit"],
  ["BUILD_NUMBER", "42a", "buildNumber"],
  ["RELEASE_TAG", "release-42", "releaseTag"],
  ["BUILD_DATE", "13/11/2026", "buildDate"],
] as const)("treats an invalid %s (%s) as missing", (name, value, field) => {
  process.env[name] = value;
  expect(getBuildInfo()[field]).toBeNull();
});

it("falls back to dev for an invalid version", () => {
  process.env.APP_VERSION = "1.0 <b>";
  expect(getBuildInfo().version).toBe("dev");
});
