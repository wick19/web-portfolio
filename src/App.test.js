import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders homepage hero content", () => {
  window.location.hash = "#home";
  render(<App />);
  expect(screen.getByText(/Engineering High-Performance Solutions/i)).toBeInTheDocument();
});
