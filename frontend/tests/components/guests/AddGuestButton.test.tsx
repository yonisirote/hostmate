import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddGuestButton } from '@/features/guests/components/AddGuestButton';

vi.mock('@/features/guests/api/guestsApi');
vi.mock('@/context/useAuth');
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { createGuest } from '@/features/guests/api/guestsApi';
import { useAuth } from '@/context/useAuth';
import toast from 'react-hot-toast';

describe('AddGuestButton', () => {
  const mockOnAdded = vi.fn();
  const mockAccessToken = 'mock-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAdded.mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({ accessToken: mockAccessToken } as ReturnType<typeof useAuth>);
    vi.mocked(createGuest).mockResolvedValue({
      id: 1,
      name: 'John Doe',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  it('renders Add guest button', () => {
    render(<AddGuestButton onAdded={mockOnAdded} />);

    const button = screen.getByRole('button', { name: 'Add guest' });
    expect(button).toBeInTheDocument();
  });

  it('opens modal when Add guest button is clicked', async () => {
    const user = userEvent.setup();
    render(<AddGuestButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add guest' }));

    expect(screen.getByText('Add guest', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByLabelText('Guest name')).toBeInTheDocument();
  });

  it('closes modal when clicking overlay', async () => {
    const user = userEvent.setup();
    render(<AddGuestButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add guest' }));
    expect(screen.getByLabelText('Guest name')).toBeInTheDocument();

    const overlay = screen.getByText('Add guest', { selector: 'h3' }).closest('.fixed');
    if (overlay) {
      await user.click(overlay);
    }

    expect(screen.queryByLabelText('Guest name')).not.toBeInTheDocument();
  });

  it('closes modal when clicking Close button', async () => {
    const user = userEvent.setup();
    render(<AddGuestButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add guest' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByLabelText('Guest name')).not.toBeInTheDocument();
  });

  it('closes modal when clicking Cancel button', async () => {
    const user = userEvent.setup();
    render(<AddGuestButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add guest' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('Guest name')).not.toBeInTheDocument();
  });

  it('shows error toast when submitting empty name', async () => {
    const user = userEvent.setup();
    render(<AddGuestButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add guest' }));
    await user.click(screen.getByRole('button', { name: 'Save guest' }));

    expect(toast.error).toHaveBeenCalledWith('Please enter a guest name');
  });

  it('submits form with guest data', async () => {
    const user = userEvent.setup();
    render(<AddGuestButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add guest' }));
    await user.type(screen.getByLabelText('Guest name'), 'John Doe');
    await user.click(screen.getByRole('button', { name: 'Save guest' }));

    expect(createGuest).toHaveBeenCalledWith({ name: 'John Doe' });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Guest added');
      expect(mockOnAdded).toHaveBeenCalled();
    });
  });

  it('trims whitespace from guest name', async () => {
    const user = userEvent.setup();
    render(<AddGuestButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add guest' }));
    await user.type(screen.getByLabelText('Guest name'), '  John Doe  ');
    await user.click(screen.getByRole('button', { name: 'Save guest' }));

    expect(createGuest).toHaveBeenCalledWith({ name: 'John Doe' });
  });

  it('shows Adding... button text while submitting', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: { id: number; name: string; created_at: string; updated_at: string }) => void;
    vi.mocked(createGuest).mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    render(<AddGuestButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add guest' }));
    await user.type(screen.getByLabelText('Guest name'), 'John Doe');
    await user.click(screen.getByRole('button', { name: 'Save guest' }));

    expect(screen.getByRole('button', { name: 'Adding...' })).toBeInTheDocument();

    resolvePromise!({
      id: 1,
      name: 'John Doe',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  it('disables buttons while submitting', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: { id: number; name: string; created_at: string; updated_at: string }) => void;
    vi.mocked(createGuest).mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    render(<AddGuestButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add guest' }));
    await user.type(screen.getByLabelText('Guest name'), 'John Doe');
    await user.click(screen.getByRole('button', { name: 'Save guest' }));

    const saveButton = screen.getByRole('button', { name: 'Adding...' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const closeButton = screen.getByRole('button', { name: 'Close' });

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(closeButton).toBeDisabled();

    resolvePromise!({
      id: 1,
      name: 'John Doe',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });
});
