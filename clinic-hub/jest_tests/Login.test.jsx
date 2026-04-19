import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login_page from '../src/pages/Login_page';

global.alert = jest.fn();

// mock navigate
const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

// mock fetch
global.fetch = jest.fn();

describe('Authentication (Login_page)', () => {

  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
    alert.mockClear();
    mockedNavigate.mockClear();
  });

  test('successful login stores token and navigates', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'fake-jwt-token',
        role: 'admin'
      })
    });

    render(
      <BrowserRouter>
        <Login_page />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'admin@clinic.com' }
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('fake-jwt-token');
      expect(alert).toHaveBeenCalledWith("Logged in as admin");
      expect(mockedNavigate).toHaveBeenCalled();
    });
  });

  test('failed login triggers alert with error message', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        message: 'Invalid credentials'
      })
    });

    render(
      <BrowserRouter>
        <Login_page />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@clinic.com' }
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpass' }
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith("Invalid credentials");
    });
  });

});