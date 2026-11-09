import { fireEvent, render, screen } from "@testing-library/react";
import { Counter } from "./counter";

test("shows the value and reports increments", () => {
  const onIncrement = jest.fn();
  render(<Counter value={2} onIncrement={onIncrement} />);
  expect(screen.getByText("2")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add one" }));
  expect(onIncrement).toHaveBeenCalledTimes(1);
});
