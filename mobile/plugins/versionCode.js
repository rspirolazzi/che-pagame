// Android versionCode derived from the visible version (feature 010): one source of truth, and
// every newer version gets a higher code. JavaScript so app.config.ts can import it.

/**
 * @param {string} version MAJOR.MINOR.PATCH, MINOR and PATCH below 100.
 * @returns {number} MAJOR * 10000 + MINOR * 100 + PATCH, e.g. 1.2.3 -> 10203.
 */
function versionCodeFrom(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Invalid version "${version}": expected MAJOR.MINOR.PATCH`);
  }
  const [major, minor, patch] = match.slice(1).map(Number);
  if (minor >= 100 || patch >= 100) {
    throw new Error(`Invalid version "${version}": MINOR and PATCH must be below 100`);
  }
  return major * 10000 + minor * 100 + patch;
}

module.exports = { versionCodeFrom };
