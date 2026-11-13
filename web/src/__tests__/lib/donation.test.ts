import { parseDonationUrl } from "@/lib/donation";

it("accepts an https link (FR-001)", () => {
  expect(parseDonationUrl("https://cafecito.app/chepagame")).toBe("https://cafecito.app/chepagame");
  expect(parseDonationUrl("  https://cafecito.app/chepagame  ")).toBe(
    "https://cafecito.app/chepagame",
  );
});

it.each([
  undefined,
  "",
  "   ",
  "http://cafecito.app/x",
  "javascript:alert(1)",
  "ftp://x.org",
  "cafecito.app/x",
])("rejects %p, so the button is hidden (FR-002)", (value) => {
  expect(parseDonationUrl(value)).toBeNull();
});
