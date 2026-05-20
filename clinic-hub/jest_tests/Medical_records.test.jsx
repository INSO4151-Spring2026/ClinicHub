import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MedicalRecordForm from '../src/pages/MedicalRecordForm';
import PatientVisitHistory from '../src/pages/PatientVisitHistory';

global.fetch = jest.fn();

const mockRecords = [
  {
    medical_record_id: 1,
    patient_id: 1,
    provider_user_id: 2,
    appointment_id: null,
    record_date: "2026-05-10T14:00:00+00:00",
    diagnosis: "Hypertension",
    treatment_plan: "Lifestyle changes and medication",
    notes: "Follow up in 4 weeks",
    provider_name: "Dr. Jane Smith",
    patient_name: "John Doe",
  },
];

const renderForm = (props = {}) =>
  render(
    <BrowserRouter>
      <MedicalRecordForm
        patientId={1}
        patientName="John Doe"
        providerName="Dr. Jane Smith"
        appointmentId={null}
        {...props}
      />
    </BrowserRouter>
  );

const renderHistory = (props = {}) =>
  render(
    <BrowserRouter>
      <PatientVisitHistory patientId={1} {...props} />
    </BrowserRouter>
  );

// ---------------------------------------------------------------------------
// MedicalRecordForm
// ---------------------------------------------------------------------------

describe('MedicalRecordForm', () => {

  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'fake-token');
  });

  test('renders read-only fields and form inputs correctly', () => {
    renderForm();

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dr. Jane Smith')).toBeInTheDocument();
    expect(screen.getByLabelText(/diagnosis/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/treatment plan/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save record/i })).toBeInTheDocument();
  });

  test('submits a POST request on form submit', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          message: 'Medical record created successfully',
          record: mockRecords[0],
        }),
    });

    renderForm();

    fireEvent.change(screen.getByLabelText(/diagnosis/i), {
      target: { value: 'Hypertension' },
    });
    fireEvent.change(screen.getByLabelText(/treatment plan/i), {
      target: { value: 'Lifestyle changes and medication' },
    });
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: 'Follow up in 4 weeks' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save record/i }));
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/medical-records',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/visit record saved successfully/i)).toBeInTheDocument();
    });
  });

  test('shows validation error when diagnosis is missing', async () => {
    renderForm();

    fireEvent.change(screen.getByLabelText(/treatment plan/i), {
      target: { value: 'Some plan' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save record/i }));
    });

    expect(screen.getByText(/diagnosis is required/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

});

// ---------------------------------------------------------------------------
// PatientVisitHistory
// ---------------------------------------------------------------------------

describe('PatientVisitHistory', () => {

  beforeEach(() => {
    fetch.mockClear();
    localStorage.setItem('token', 'fake-token');
  });

  test('loads and displays records on mount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockRecords),
    });

    await act(async () => {
      renderHistory();
    });

    await waitFor(() => {
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Lifestyle changes and medication')).toBeInTheDocument();
      expect(screen.getByText('Follow up in 4 weeks')).toBeInTheDocument();
      expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
    });
  });

  test('shows loading state initially', async () => {
    fetch.mockImplementation(() => new Promise(() => {})); // never resolves

    await act(async () => {
      renderHistory();
    });

    expect(screen.getByText(/loading visit history/i)).toBeInTheDocument();
  });

  test('handles an empty records list gracefully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
    });

    await act(async () => {
      renderHistory();
    });

    await waitFor(() => {
      expect(screen.getByText(/no visit records found/i)).toBeInTheDocument();
    });
  });

});
