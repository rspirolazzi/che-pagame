/**
 * Build information baked into the production image (feature 009, research R5).
 *
 * Read at runtime from APP_VERSION, BUILD_NUMBER, BUILD_DATE, RELEASE_TAG and GIT_SHA (no
 * NEXT_PUBLIC_ prefix: nothing is inlined into the browser bundle). Values that do not match
 * their expected format are reported as missing, so arbitrary text is never shown.
 */
export interface BuildInfo {
  version: string;
  buildNumber: string | null;
  buildDate: string | null;
  releaseTag: string | null;
  commit: string | null;
}

const VERSION = /^\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?$/;

function read(name: string, pattern: RegExp): string | null {
  const value = process.env[name]?.trim() ?? "";
  return pattern.test(value) ? value : null;
}

export function getBuildInfo(): BuildInfo {
  return {
    version: read("APP_VERSION", VERSION) ?? "dev",
    buildNumber: read("BUILD_NUMBER", /^\d{1,10}$/),
    buildDate: read("BUILD_DATE", /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/),
    releaseTag: read("RELEASE_TAG", /^main-\d{1,10}$/),
    commit: read("GIT_SHA", /^[0-9a-f]{7,40}$/),
  };
}
