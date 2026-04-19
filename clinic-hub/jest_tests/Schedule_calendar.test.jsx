import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Calendar_page from '../src/pages/Calendar_page';
import { MemoryRouter } from 'react-router-dom';

// ---------------- MOCKS ----------------
global.fetch = jest.fn();
global.alert = jest.fn();

const renderPage = () => {
  return render(
    <MemoryRouter>
      <Calendar_page />
    </MemoryRouter>
  );
};

// Helper: make appointment match TODAY (VERY IMPORTANT)
const getTodayAppointment = () => {
  const today = new Date();

  return {
    appointment_id: 1,
    patient_id: 10,
    reason: "Checkup",
    scheduled_start: new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      10,
      0
    ).toISOString()
  };
};

describe('Scheduling System (Calendar + Appointments)', () => {

  beforeEach(() => {
    fetch.mockClear();
    alert.mockClear();
    localStorage.setItem('token', 'fake-token');
  });

  // ---------------- LOAD TEST ----------------
  test('loads appointments and displays them on calendar', async () => {
    const mockAppointment = getTodayAppointment();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockAppointment]
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/checkup/i)).toBeInTheDocument();
    });
  });

  // ---------------- DELETE TEST ----------------
  test('deletes appointment (DELETE request)', async () => {
    const mockAppointment = getTodayAppointment();

    // 1st call = GET appointments
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockAppointment]
    });

    // 2nd call = DELETE request
    fetch.mockResolvedValueOnce({
      ok: true
    });

    // mock window.confirm
    window.confirm = jest.fn(() => true);

    renderPage();

    // wait for appointment to show
    await waitFor(() => {
      expect(screen.getByText(/checkup/i)).toBeInTheDocument();
    });

    // click delete button using aria-label (CORRECT FIX)
    const deleteBtn = screen.getByLabelText('delete-1');
    fireEvent.click(deleteBtn);

    // confirm fetch DELETE called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/appointments/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

});