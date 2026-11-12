import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { PaperProvider, TextInput, useTheme } from "react-native-paper";

import type { ThemeName } from "@/services/api/types";
import { darkTheme, lightTheme, useAppTheme } from "@/theme";

function Form() {
  const theme = useTheme();
  const [title, setTitle] = useState("");
  return (
    <View testID="screen" style={{ backgroundColor: theme.colors.background }}>
      <TextInput label="Concepto" accessibilityLabel="Concepto" value={title} onChangeText={setTitle} />
    </View>
  );
}

function App() {
  const [preference, setPreference] = useState<ThemeName>("light");
  const theme = useAppTheme(preference);
  return (
    <PaperProvider theme={theme}>
      <Pressable accessibilityRole="button" onPress={() => setPreference("dark")}>
        <Text>Oscuro</Text>
      </Pressable>
      <Form />
    </PaperProvider>
  );
}

it("changes the palette at once and keeps what was typed (FR-006, SC-005)", () => {
  render(<App />);
  expect(screen.getByTestId("screen").props.style.backgroundColor).toBe(
    lightTheme.colors.background,
  );
  fireEvent.changeText(screen.getByLabelText("Concepto"), "Cena en el centro");
  fireEvent.press(screen.getByRole("button", { name: "Oscuro" }));
  expect(screen.getByTestId("screen").props.style.backgroundColor).toBe(
    darkTheme.colors.background,
  );
  expect(screen.getByLabelText("Concepto").props.value).toBe("Cena en el centro");
});
