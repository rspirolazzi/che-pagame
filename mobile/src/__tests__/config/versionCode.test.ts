const { versionCodeFrom } = require("../../../plugins/versionCode");

describe("versionCodeFrom", () => {
  it.each([
    ["1.0.0", 10000],
    ["1.2.3", 10203],
    ["0.0.1", 1],
    ["12.34.56", 123456],
  ])("maps %s to %d", (version, code) => {
    expect(versionCodeFrom(version)).toBe(code);
  });

  it("grows with every newer version", () => {
    expect(versionCodeFrom("2.0.0")).toBeGreaterThan(versionCodeFrom("1.99.99"));
    expect(versionCodeFrom("1.1.0")).toBeGreaterThan(versionCodeFrom("1.0.99"));
  });

  it.each(["1.0", "1.0.0-beta", "v1.0.0", "1.100.0", "1.0.100", ""])("rejects %p", (version) => {
    expect(() => versionCodeFrom(version)).toThrow(/version/);
  });
});
