import { getBuildInfo } from "@/lib/buildInfo";

// Read the build information of the running image on every request, never at build time.
export const dynamic = "force-dynamic";

/**
 * Public health and version endpoint (feature 009, contracts/health.md), used by the production
 * healthcheck. It does not call the backend, so a backend outage never restarts the web app.
 */
export async function GET(): Promise<Response> {
  return Response.json(
    { status: "ok", build: getBuildInfo() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
