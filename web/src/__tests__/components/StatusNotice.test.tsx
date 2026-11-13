import { fireEvent, screen } from "@testing-library/react";

import { StatusNotice } from "@/components/ui/StatusNotice";

import { renderWithIntl } from "../support/render";

it.each([
  ["warning", "Aviso"],
  ["error", "Error"],
  ["readOnly", "Solo lectura"],
  ["info", "Información"],
] as const)("%s shows an icon with an accessible name and the text (FR-010)", (kind, label) => {
  renderWithIntl(<StatusNotice kind={kind}>Pendiente de asignación</StatusNotice>);
  expect(screen.getByText("Pendiente de asignación")).toBeInTheDocument();
  expect(screen.getByLabelText(label)).toBeInTheDocument();
  expect(screen.getByText("Pendiente de asignación").closest(".notice")).toHaveClass(
    `notice-${kind}`,
  );
});

it("announces errors as alerts", () => {
  renderWithIntl(<StatusNotice kind="error">No pudimos conectarnos.</StatusNotice>);
  expect(screen.getByRole("alert")).toHaveTextContent("No pudimos conectarnos.");
});

it("renders the optional action as a button", () => {
  const onClick = jest.fn();
  renderWithIntl(
    <StatusNotice kind="warning" action={{ label: "Completarlos en Gastos", onClick }}>
      2 gastos pendientes
    </StatusNotice>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Completarlos en Gastos" }));
  expect(onClick).toHaveBeenCalledTimes(1);
});
