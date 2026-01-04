import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GuestRow } from '@/features/guests/components/GuestRow';

vi.mock('@/features/guests/api/guestsApi');
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { deleteGuest } from '@/features/guests/api/guestsApi';
import toast from 'react-hot-toast';

describe('GuestRow', () => {
  const mockOnRefresh = vi.fn();
  const mockGuest = {
    id: 1,
    name: 'Alice Johnson',
    created_at: '2024-01-15T10:00:00.000Z',
    updated_at: '2024-01-16T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnRefresh.mockResolvedValue(undefined);
    vi.mocked(deleteGuest).mockResolvedValue(undefined);
  });

  it('renders guest name', () => {
    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('renders guest avatar with first letter', () => {
    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders uppercase first letter', () => {
    const guestWithLowercase = { ...mockGuest, name: 'bob smith' };
    render(<GuestRow guest={guestWithLowercase} onRefresh={mockOnRefresh} />);

    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('has Share link button', () => {
    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    expect(screen.getByRole('button', { name: 'Share link' })).toBeInTheDocument();
  });

  it('has View rankings button', () => {
    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    expect(screen.getByRole('button', { name: 'View rankings' })).toBeInTheDocument();
  });

  it('has edit button with accessible label', () => {
    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    const editButton = screen.getByRole('button', { name: 'Edit guest' });
    expect(editButton).toBeInTheDocument();
  });

  it('has delete button with accessible label', () => {
    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete guest' });
    expect(deleteButton).toBeInTheDocument();
  });

  it('opens delete confirmation modal when delete button clicked', async () => {
    const user = userEvent.setup();
    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete guest' }));

    expect(screen.getByText('Delete guest', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText(/Remove Alice Johnson/)).toBeInTheDocument();
  });

  it('changes delete button label when confirmation modal is open', async () => {
    const user = userEvent.setup();
    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete guest' });
    await user.click(deleteButton);

    expect(screen.getByRole('button', { name: 'Cancel delete' })).toBeInTheDocument();
  });

  it('closes delete modal when clicking Cancel button', async () => {
    const user = userEvent.setup();
    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete guest' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Delete guest', { selector: 'h3' })).not.toBeInTheDocument();
  });

  it('calls deleteGuest and shows success toast when confirmed', async () => {
    const user = userEvent.setup();
    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete guest' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(deleteGuest).toHaveBeenCalledWith(1);
    expect(toast.success).toHaveBeenCalledWith('Guest deleted');

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  it('shows error toast when deletion fails', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteGuest).mockRejectedValue(new Error('Network error'));

    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete guest' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error');
    });
  });

  it('disables buttons while deleting', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: void) => void;
    vi.mocked(deleteGuest).mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete guest' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeInTheDocument();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const closeButton = screen.getByRole('button', { name: 'Close' });
    expect(cancelButton).toBeDisabled();
    expect(closeButton).toBeDisabled();

    resolvePromise!();
  });

  it('prevents clicking delete button while already deleting', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: void) => void;
    vi.mocked(deleteGuest).mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    render(<GuestRow guest={mockGuest} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete guest' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    const deleteIconButtons = screen.getAllByRole('button').filter(btn =>
      btn.querySelector('svg')?.querySelector('path[d="M10 11v6"]')
    );
    const deleteButton = deleteIconButtons[1];
    await user.click(deleteButton);

    expect(deleteGuest).toHaveBeenCalledTimes(1);

    resolvePromise!();
  });
});
