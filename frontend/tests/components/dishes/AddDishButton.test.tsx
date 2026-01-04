import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddDishButton } from '@/features/dishes/components/AddDishButton';

vi.mock('@/features/dishes/api/dishesApi');
vi.mock('@/context/useAuth');
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { createDish } from '@/features/dishes/api/dishesApi';
import { useAuth } from '@/context/useAuth';
import toast from 'react-hot-toast';

describe('AddDishButton', () => {
  const mockOnAdded = vi.fn();
  const mockAccessToken = 'mock-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAdded.mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({ accessToken: mockAccessToken } as ReturnType<typeof useAuth>);
    vi.mocked(createDish).mockResolvedValue({
      id: 1,
      name: 'Pasta Carbonara',
      description: 'Creamy pasta dish',
      category: 'main',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  it('renders Add dish button', () => {
    render(<AddDishButton onAdded={mockOnAdded} />);

    const button = screen.getByRole('button', { name: 'Add dish' });
    expect(button).toBeInTheDocument();
  });

  it('opens modal when Add dish button is clicked', async () => {
    const user = userEvent.setup();
    render(<AddDishButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add dish' }));

    expect(screen.getByText('Add dish', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByLabelText('Dish name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('closes modal when clicking overlay', async () => {
    const user = userEvent.setup();
    render(<AddDishButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add dish' }));
    expect(screen.getByLabelText('Dish name')).toBeInTheDocument();

    const overlay = screen.getByText('Add dish', { selector: 'h3' }).closest('.fixed');
    if (overlay) {
      await user.click(overlay);
    }

    expect(screen.queryByLabelText('Dish name')).not.toBeInTheDocument();
  });

  it('closes modal when clicking Close button', async () => {
    const user = userEvent.setup();
    render(<AddDishButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add dish' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByLabelText('Dish name')).not.toBeInTheDocument();
  });

  it('closes modal when clicking Cancel button', async () => {
    const user = userEvent.setup();
    render(<AddDishButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add dish' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('Dish name')).not.toBeInTheDocument();
  });

  it('shows error toast when submitting empty name', async () => {
    const user = userEvent.setup();
    render(<AddDishButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add dish' }));
    await user.click(screen.getByRole('button', { name: 'Save dish' }));

    expect(toast.error).toHaveBeenCalledWith('Please enter a dish name');
  });

  it('submits form with dish data', async () => {
    const user = userEvent.setup();
    render(<AddDishButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add dish' }));

    await user.type(screen.getByLabelText('Dish name'), 'Pasta Carbonara');
    await user.type(screen.getByLabelText('Description'), 'Creamy pasta dish');
    await user.selectOptions(screen.getByLabelText('Category'), 'main');

    await user.click(screen.getByRole('button', { name: 'Save dish' }));

    expect(createDish).toHaveBeenCalledWith({
      name: 'Pasta Carbonara',
      description: 'Creamy pasta dish',
      category: 'main',
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Dish added');
      expect(mockOnAdded).toHaveBeenCalled();
    });
  });

  it('shows Adding... button text while submitting', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: { id: number; name: string; category: string; created_at: string; updated_at: string }) => void;
    vi.mocked(createDish).mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    render(<AddDishButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add dish' }));
    await user.type(screen.getByLabelText('Dish name'), 'Pasta Carbonara');
    await user.click(screen.getByRole('button', { name: 'Save dish' }));

    expect(screen.getByRole('button', { name: 'Adding...' })).toBeInTheDocument();

    resolvePromise!({
      id: 1,
      name: 'Pasta Carbonara',
      description: undefined,
      category: 'main',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  it('disables buttons while submitting', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: { id: number; name: string; category: string; created_at: string; updated_at: string }) => void;
    vi.mocked(createDish).mockImplementation(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    render(<AddDishButton onAdded={mockOnAdded} />);

    await user.click(screen.getByRole('button', { name: 'Add dish' }));
    await user.type(screen.getByLabelText('Dish name'), 'Pasta Carbonara');
    await user.click(screen.getByRole('button', { name: 'Save dish' }));

    const saveButton = screen.getByRole('button', { name: 'Adding...' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    const closeButton = screen.getByRole('button', { name: 'Close' });

    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(closeButton).toBeDisabled();

    resolvePromise!({
      id: 1,
      name: 'Pasta Carbonara',
      description: undefined,
      category: 'main',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });
});
