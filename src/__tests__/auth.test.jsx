import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import { useAuthStore } from '../stores/authStore';

// Mock the API calls
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Authentication Smoke Tests', () => {
  beforeEach(() => {
    // Clear localStorage and store state
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('Login form renders with email and password fields', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getAllByLabelText(/Email/i)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Password/i)[0]).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Masuk/i })[0]).toBeInTheDocument();
  });

  it('Register form validates required fields', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </QueryClientProvider>
    );

    const submitButton = screen.getByRole('button', { name: /Daftar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Username minimal 3 karakter/i)).toBeInTheDocument();
      expect(screen.getByText(/Format email tidak valid/i)).toBeInTheDocument();
      expect(screen.getByText(/Password minimal 8 karakter/i)).toBeInTheDocument();
    });
  });

  it('Auth store login and logout persists user (token is memory-only)', async () => {
    const { login, logout } = useAuthStore.getState();
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
    const mockToken = 'mock-token';

    login(mockToken, mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().token).toBe(mockToken);
    expect(localStorage.getItem('pla_user')).toContain('testuser');
    // Access token must NOT live in localStorage (httpOnly cookie path)
    expect(localStorage.getItem('pla_token')).toBeNull();

    await logout({ skipServer: true });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(localStorage.getItem('pla_user')).toBeNull();
  });
});
