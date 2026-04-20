import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import Patient_list from '../src/pages/Patient_list_page';
import { BrowserRouter } from 'react-router-dom';

global.fetch = jest.fn();

const renderComponent = () =>
  render(
    <BrowserRouter>
      <Patient_list />
    </BrowserRouter>
  );

describe('Patient List', () => {

  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'fake-token');
  });

  test('fetches and displays patients', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([
        {
          patient_id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john@test.com",
          phone: "123456789"
        }
      ])
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText("John")).toBeInTheDocument();
      expect(screen.getByText("Doe")).toBeInTheDocument();
      expect(screen.getByText("john@test.com")).toBeInTheDocument();
    });
  });

  test('shows loading initially', async () => {
    fetch.mockImplementation(() =>
      new Promise(() => {}) // never resolves
    );

    await act(async () => {
      renderComponent();
    });

    expect(screen.getByText(/Loading Patients/i)).toBeInTheDocument();
  });

  test('handles empty patient list', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ([])
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(screen.getByText(/No patients found/i)).toBeInTheDocument();
    });
  });

  // ✅ NEW TEST: DELETE PATIENT
  test('deletes a patient successfully', async () => {
  // mock confirm (VERY IMPORTANT)
    window.confirm = jest.fn(() => true);

    fetch
        // initial GET
        .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ([
            {
            patient_id: 1,
            first_name: "John",
            last_name: "Doe",
            email: "john@test.com",
            phone: "123456789"
            }
        ])
        })
        // DELETE request
        .mockResolvedValueOnce({
        ok: true
        })
        // reload GET after delete (if your component re-fetches)
        .mockResolvedValueOnce({
        ok: true,
        json: async () => []
        });

    await act(async () => {
        renderComponent();
    });

    await waitFor(() => {
        expect(screen.getByText("John")).toBeInTheDocument();
    });

    // click delete button (SVG button, no label)
    const deleteButton = screen.getAllByRole('button').find(btn =>
        btn.innerHTML.includes('trash')
    );

    await act(async () => {
        deleteButton.click();
    });

    await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
    });

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/patients"),
        expect.objectContaining({
            method: "DELETE",
            headers: expect.objectContaining({
            Authorization: "Bearer fake-token"
            })
        })
        );
    });
  });

});