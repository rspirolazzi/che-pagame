import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MarkPaidDialog } from "@/components/balances/MarkPaidDialog";

import { renderWithIntl } from "../support/render";

const suggestion = {
  from: { id: "p2", name: "Leandro" },
  to: { id: "p1", name: "Ana" },
  amount: "30.00",
};

it("Escape closes the dialog without confirming (FR-016)", async () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  renderWithIntl(
    <MarkPaidDialog
      suggestion={suggestion as never}
      currency="ARS"
      decimals={2}
      date="2026-11-13"
      pending={false}
      error={null}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onConfirm).not.toHaveBeenCalled();
});
