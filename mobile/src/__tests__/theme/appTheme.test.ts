import { renderHook } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import { darkTheme, lightTheme, useAppTheme } from "@/theme";
import { tokens } from "@/theme/tokens.generated";

describe.each([
  ["light", lightTheme],
  ["dark", darkTheme],
] as const)("%s theme", (mode, theme) => {
  const colors = tokens.color[mode];

  it("maps the identity roles to Paper colors", () => {
    expect(theme.dark).toBe(mode === "dark");
    expect(theme.colors.primary).toBe(colors.primary);
    expect(theme.colors.onPrimary).toBe(colors.onPrimary);
    expect(theme.colors.background).toBe(colors.background);
    expect(theme.colors.surface).toBe(colors.surface);
    expect(theme.colors.onSurface).toBe(colors.text);
    expect(theme.colors.onSurfaceVariant).toBe(colors.textMuted);
    expect(theme.colors.error).toBe(colors.negative);
    expect(theme.colors.outline).toBe(colors.controlBorder);
    expect(theme.colors.outlineVariant).toBe(colors.border);
    expect(theme.colors.secondaryContainer).toBe(colors.accent);
    expect(theme.colors.onSecondaryContainer).toBe(colors.onAccent);
  });

  it("adds the colors Paper does not have", () => {
    expect(theme.custom.positive).toBe(colors.positive);
    expect(theme.custom.negative).toBe(colors.negative);
    expect(theme.custom.warning).toBe(colors.warning);
    expect(theme.custom.accent).toBe(colors.accent);
    expect(theme.custom.onAccent).toBe(colors.onAccent);
    expect(theme.custom.spacing).toEqual(tokens.spacing);
    expect(theme.custom.radius).toEqual(tokens.radius);
  });
});

it("follows the device when the preference is system (FR-006)", () => {
  const scheme = jest.spyOn(ReactNative, "useColorScheme");
  scheme.mockReturnValue("dark");
  expect(renderHook(() => useAppTheme("system")).result.current).toBe(darkTheme);
  scheme.mockReturnValue("light");
  expect(renderHook(() => useAppTheme("system")).result.current).toBe(lightTheme);
  expect(renderHook(() => useAppTheme("dark")).result.current).toBe(darkTheme);
  scheme.mockRestore();
});
