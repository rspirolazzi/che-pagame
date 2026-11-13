/**
 * @jest-environment node
 */
import { GET } from "@/app/api/health/route";

beforeEach(() => {
  process.env.APP_VERSION = "0.1.0";
  process.env.GIT_SHA = "397655e";
});

it("reports ok with the build information and nothing else (contracts/health.md)", async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  const body = await response.json();
  expect(Object.keys(body).sort()).toEqual(["build", "status"]);
  expect(body.status).toBe("ok");
  expect(Object.keys(body.build).sort()).toEqual([
    "buildDate",
    "buildNumber",
    "commit",
    "releaseTag",
    "version",
  ]);
  expect(body.build.version).toBe("0.1.0");
  expect(body.build.commit).toBe("397655e");
});
