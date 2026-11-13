import Link from "next/link";

/**
 * The approved wordmark "A. Tilde final" (feature 006): "Che" in primary, "Pagame" in the text
 * color and the sun "saldado" check. Theme colors come from the CSS variables, so it switches
 * mode by itself and stays sharp at any zoom (research R4).
 */
export function Logo({ href, size = "md" }: { href: string; size?: "sm" | "md" | "lg" }) {
  return (
    <Link href={href} className={`logo logo-${size}`} aria-label="ChePagame">
      <span className="logo-che" aria-hidden="true">
        Che
      </span>
      <span aria-hidden="true">Pagame</span>
      <svg
        className="logo-tick"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M3.5 12.5l5.5 5.5L20.5 5.5" />
      </svg>
    </Link>
  );
}
