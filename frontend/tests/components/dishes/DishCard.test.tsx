import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DishCard } from '@/features/dishes/components/DishCard';

vi.mock('@/features/dishes/api/dishesApi');
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { deleteDish } from '@/features/dishes/api/dishesApi';
import toast from 'react-hot-toast';

describe('DishCard', () => {
  const mockOnRefresh = vi.fn();
  const mockDish = {
    id: 1,
    name: 'Pasta Carbonara',
    description: 'Creamy pasta with bacon',
    category: 'main' as const,
    created_at: '2024-01-15T10:00:00.000Z',
    updated_at: '2024-01-16T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnRefresh.mockResolvedValue(undefined);
    vi.mocked(deleteDish).mockResolvedValue(undefined);
  });

  it('renders dish name', () => {
    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    expect(screen.getByText('Pasta Carbonara')).toBeInTheDocument();
  });

  it('renders dish description', () => {
    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    expect(screen.getByText('Creamy pasta with bacon')).toBeInTheDocument();
  });

  it('renders without description when not provided', () => {
    const dishWithoutDescription = { ...mockDish, description: undefined };
    render(<DishCard dish={dishWithoutDescription} onRefresh={mockOnRefresh} />);

    expect(screen.queryByText('Creamy pasta with bacon')).not.toBeInTheDocument();
  });

  it('renders creation date', () => {
    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    expect(screen.getByText(/Added/)).toBeInTheDocument();
  });

  it('renders update date', () => {
    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('has edit button with accessible label', () => {
    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    const editButton = screen.getByRole('button', { name: 'Edit dish' });
    expect(editButton).toBeInTheDocument();
  });

  it('has delete button with accessible label', () => {
    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete dish' });
    expect(deleteButton).toBeInTheDocument();
  });

  it('opens delete confirmation modal when delete button clicked', async () => {
    const user = userEvent.setup();
    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete dish' }));

    expect(screen.getByText('Delete dish', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText(/Remove Pasta Carbonara/)).toBeInTheDocument();
  });

  it('changes delete button label when confirmation modal is open', async () => {
    const user = userEvent.setup();
    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete dish' });
    await user.click(deleteButton);

    expect(screen.getByRole('button', { name: 'Cancel delete' })).toBeInTheDocument();
  });

  it('closes delete modal when Cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete dish' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Delete dish', { selector: 'h3' })).not.toBeInTheDocument();
  });

  it('closes delete modal when Close button clicked', async () => {
    const user = userEvent.setup();
    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete dish' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByText('Delete dish', { selector: 'h3' })).not.toBeInTheDocument();
  });

  it('calls deleteDish and shows success toast when confirmed', async () => {
    const user = userEvent.setup();
    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete dish' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(deleteDish).toHaveBeenCalledWith(1);
    expect(toast.success).toHaveBeenCalledWith('Dish deleted');

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  it('shows error toast when deletion fails', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteDish).mockRejectedValue(new Error('Network error'));

    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete dish' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error');
    });
  });

  it('disables buttons while deleting', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: void) => void;
    vi.mocked(deleteDish).mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete dish' }));
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
    vi.mocked(deleteDish).mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    render(<DishCard dish={mockDish} onRefresh={mockOnRefresh} />);

    await user.click(screen.getByRole('button', { name: 'Delete dish' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    const deleteIconButtons = screen.getAllByRole('button').filter(btn =>
      btn.querySelector('svg')?.querySelector('path[d="M10 11v6"]')
    );
    const deleteButton = deleteIconButtons[1];
    await user.click(deleteButton);

    expect(deleteDish).toHaveBeenCalledTimes(1);

    resolvePromise!();
  });
});
