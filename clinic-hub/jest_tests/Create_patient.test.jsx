import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Create_patient from "../src/pages/Create_patient";

// Mock navigate
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Create Patient Page", () => {
  beforeEach(() => {
    // Mock token
    Storage.prototype.getItem = jest.fn(() => "fake-token");

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
      })
    );

    // Mock alert (to prevent errors)
    window.alert = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("creates a patient successfully (POST request)", async () => {
    render(
      <MemoryRouter>
        <Create_patient />
      </MemoryRouter>
    );

    // Fill required fields
    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "John" },
    });

    fireEvent.change(screen.getByLabelText("Last Name"), {
      target: { value: "Doe" },
    });

    fireEvent.change(screen.getByLabelText("Date of Birth"), {
      target: { value: "2000-01-01" },
    });

    fireEvent.change(screen.getByLabelText("Sex"), {
      target: { value: "male" },
    });

    // Optional fields (safe to include)
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@test.com" },
    });

    fireEvent.change(screen.getByLabelText("Phone"), {
      target: { value: "123456789" },
    });

    // Submit form
    fireEvent.click(
      screen.getByRole("button", { name: /create patient/i })
    );

    // Assertions
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/patients",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer fake-token",
          }),
          body: expect.any(FormData),
        })
      );
    });

    // Navigation check
    expect(mockNavigate).toHaveBeenCalledWith("/patients");

    // Alert check
    expect(window.alert).toHaveBeenCalledWith(
      "✅ Patient created successfully!"
    );
  });
});