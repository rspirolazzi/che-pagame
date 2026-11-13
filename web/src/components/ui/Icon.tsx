/** Small inline icon set (24px grid, stroke icons) so the Web needs no icon library (R8). */
const PATHS = {
  home: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z",
  accounts:
    "M6 8a3 3 0 1 0 6 0 3 3 0 1 0-6 0M3 19c0-3.3 2.7-5 6-5s6 1.7 6 5M14.5 9a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0M16 14c2.9 0 5 1.4 5 4",
  profile: "M8 8a4 4 0 1 0 8 0 4 4 0 1 0-8 0M4 20c0-4 3.6-6 8-6s8 2 8 6",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7.5",
  alert: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M12 7.5v5.5M12 16.5v.01",
  error: "M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7zM12 7.5v5.5M12 16.5v.01",
  lock: "M5 12a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM8 10V7a4 4 0 0 1 8 0v3",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M12 11v5.5M12 7.5v.01",
  back: "M15 6l-6 6 6 6",
  settings:
    "M9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4",
  export: "M12 4v11M7.5 8.5L12 4l4.5 4.5M5 14v5h14v-5",
  copy: "M8 10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2zM16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3",
  mail: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3.5 6.5L12 13l8.5-6.5",
  split: "M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16M12 4v16M12 12l6-5",
  scale: "M12 4v16M6 8h12M4 14l2-6 2 6a2 2 0 0 1-4 0zM16 14l2-6 2 6a2 2 0 0 1-4 0z",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = "1.25em" }: { name: IconName; size?: string }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
