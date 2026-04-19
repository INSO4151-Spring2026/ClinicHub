import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Records_page from '../src/pages/Records_page';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';

// -------------------- MOCKS --------------------
global.fetch = jest.fn();
global.alert = jest.fn();

const mockPatient = {
  patient_id: 1,
  first_name: "John",
  last_name: "Doe",
  email: "john@test.com",
  phone: "123456789",
  address: "Test Street",
  dob: "2000-01-01",
  blood_type: "O+"
};

// Helper to render with route param id
const renderPage = () => {
  return render(
    <MemoryRouter initialEntries={['/patients/1']}>
      <Routes>
        <Route path="/patients/:id" element={<Records_page />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Patient Records Page', () => {

  beforeEach(() => {
    fetch.mockClear();
    alert.mockClear();
    localStorage.setItem('token', 'fake-token');
  });

  // -------------------- LOAD TEST --------------------
  test('loads patient data on mount', async () => {

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPatient
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue("John")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
    });
  });

  // -------------------- SAVE TEST --------------------
  test('saves updated patient data (PUT request)', async () => {

    // 1st call = GET patient
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPatient
    });

    // 2nd call = PUT update
    fetch.mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          message: "Patient updated successfully",
          patient_id: 1
        })
    });

    renderPage();

    // wait for data
    await waitFor(() => {
      expect(screen.getByDisplayValue("John")).toBeInTheDocument();
    });

    // enter edit mode
    fireEvent.click(screen.getByText(/edit record/i));

    // change first name
    fireEvent.change(screen.getByDisplayValue("John"), {
      target: { value: "Johnny" }
    });

    // click save
    fireEvent.click(screen.getByText(/save changes/i));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/patients/1",
        expect.objectContaining({
          method: "PUT"
        })
      );
    });

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith("✅ Patient updated");
    });
  });

});