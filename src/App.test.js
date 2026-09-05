import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders homepage hero content", () => {
  window.location.hash = "#home";
  render(<App />);
  expect(screen.getAllByText(/Full-stack AI\/ML Engineer/i).length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: /Ask AI/i })).toBeInTheDocument();
});
