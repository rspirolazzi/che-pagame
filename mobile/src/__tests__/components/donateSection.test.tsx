import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";

import { DonateSection } from "@/components/DonateSection";

import { renderScreen } from "../support/render";

const URL = "https://cafecito.app/chepagame";

afterEach(() => jest.restoreAllMocks());

it("opens the donation page in the system browser (FR-003)", async () => {
  const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  renderScreen(<DonateSection url={URL} />);
  expect(screen.getByText(/ChePagame es gratuito/)).toBeOnTheScreen();
  fireEvent.press(screen.getByText("Apoyá ChePagame"));
  await waitFor(() => expect(open).toHaveBeenCalledWith(URL));
  expect(screen.queryByRole("alert")).toBeNull();
});

it("shows a clear error when the link cannot be opened (FR-011)", async () => {
  jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("no browser"));
  renderScreen(<DonateSection url={URL} />);
  fireEvent.press(screen.getByText("Apoyá ChePagame"));
  expect(await screen.findByRole("alert")).toBeOnTheScreen();
  expect(screen.getByText(/No pudimos abrir/)).toBeOnTheScreen();
});

it("renders nothing without a link (FR-002)", () => {
  renderScreen(<DonateSection url={null} />);
  expect(screen.queryByText("Apoyá ChePagame")).toBeNull();
});
