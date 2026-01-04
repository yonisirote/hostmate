import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '@/pages/LoginPage';

vi.mock('react-router-dom');
vi.mock('@/lib/axios');
vi.mock('@/context/useAuth');
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { useAuth } from '@/context/useAuth';
import toast from 'react-hot-toast';

const mockNavigate = vi.fn();

describe('LoginPage', () => {
  const mockSetAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useAuth).mockReturnValue({ setAuth: mockSetAuth, accessToken: null, userId: null } as ReturnType<typeof useAuth>);
    vi.mocked(api.post).mockResolvedValue({ data: { userID: 1, accessToken: 'token123' } });
  });

  it('renders initial mode with buttons', () => {
    render(<LoginPage />);

    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create an account' })).toBeInTheDocument();
  });

  it('shows login form when Log in button clicked', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('shows signup form when Create an account button clicked', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Create an account' }));

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('returns to initial mode when Cancel clicked', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument();
  });

  it('validates required fields for login', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(toast.error).toHaveBeenCalledWith('Please enter both username and password');
  });

  it('validates username length', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await user.type(screen.getByLabelText('Username'), 'abc');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(toast.error).toHaveBeenCalledWith('Username must be at least 4 characters');
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await user.type(screen.getByLabelText('Username'), 'username');
    await user.type(screen.getByLabelText('Password'), '12345');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(toast.error).toHaveBeenCalledWith('Password must be at least 6 characters');
  });

  it('validates name field for signup', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await user.type(screen.getByLabelText('Username'), 'username');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(toast.error).toHaveBeenCalledWith('Please enter name, username, and password');
  });

  it('validates name length for signup', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await user.type(screen.getByLabelText('Name'), 'A');
    await user.type(screen.getByLabelText('Username'), 'username');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(toast.error).toHaveBeenCalledWith('Name must be at least 2 characters');
  });

  it('successful login calls API and sets auth', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password123',
      });
      expect(mockSetAuth).toHaveBeenCalledWith({
        userId: 1,
        accessToken: 'token123',
      });
      expect(toast.success).toHaveBeenCalledWith('Logged in');
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('successful signup calls signup and login APIs', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await user.type(screen.getByLabelText('Name'), 'John Doe');
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/signup', {
        name: 'John Doe',
        username: 'testuser',
        password: 'password123',
      });
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password123',
      });
      expect(mockSetAuth).toHaveBeenCalledWith({
        userId: 1,
        accessToken: 'token123',
      });
      expect(toast.success).toHaveBeenCalledWith('Signed up and logged in');
    });
  });

  it('shows error message on 401 status', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    } as unknown);

    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid username or password');
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
  });

  it('shows error message on other API errors', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'Server error' },
      },
    });

    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('disables buttons while loading', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: { data: { userID: number; accessToken: string } }) => void;
    vi.mocked(api.post).mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await user.type(screen.getByLabelText('Username'), 'testuser');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByRole('button', { name: 'Please wait...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

    resolvePromise!({ data: { userID: 1, accessToken: 'token123' } });
  });

  it('renders heading and description', () => {
    render(<LoginPage />);

    expect(screen.getByText('HostMate')).toBeInTheDocument();
    expect(screen.getByText('Sign in and start curating gatherings your guests will rave about.')).toBeInTheDocument();
  });
});
