import type { ReactNode } from "react";

import { CompactMenu } from "./CompactMenu";
import { NavDestinations, SideNav } from "./SideNav";
import { Logo } from "./ui/Logo";

/** Frame with a session: the sidebar, or the compact menu on phones (FR-005a, FR-005b). */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <SideNav logo={<Logo href="/dashboard" />} />
      <CompactMenu logo={<Logo href="/dashboard" size="sm" />}>
        <NavDestinations />
      </CompactMenu>
      <div className="app-main">{children}</div>
    </div>
  );
}
