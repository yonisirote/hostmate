# Frontend Testing

This project uses **Vitest** + **React Testing Library** for unit and integration testing.

## Installation

Dependencies are already installed:
- `vitest` - Test runner
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - Custom DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `jsdom` - Browser environment simulation
- `@vitest/coverage-v8` - Code coverage reporting

## Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── components/
│   ├── dishes/
│   │   ├── AddDishButton.test.tsx
│   │   └── DishCard.test.tsx
│   ├── guests/
│   │   ├── AddGuestButton.test.tsx
│   │   └── GuestRow.test.tsx
│   └── Icons.test.tsx
├── pages/
│   └── LoginPage.test.tsx
├── utils/
│   ├── date.test.ts
│   └── errorHandler.test.ts
└── context/
src/
└── test/
    └── setup.ts  # Global test setup
```

## Writing Tests

### Example Test

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyComponent } from './MyComponent';

vi.mock('../api/myApi');
vi.mock('../../../context/useAuth');
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent onAction={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Click me' }));

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });
  });
});
```

## Best Practices

### 1. Test User Behavior, Not Implementation

✅ Good - Tests what user sees:
```typescript
expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
```

❌ Bad - Tests implementation details:
```typescript
expect(component.state().isSubmitting).toBe(true);
```

### 2. Use Accessibility Queries

```typescript
// Good - Semantic queries
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email')
screen.getByText('Welcome!')

// Avoid - Unreliable queries
screen.querySelector('.submit-button')
screen.find('[data-testid="submit"]')
```

### 3. Mock External Dependencies

```typescript
// Mock API calls
vi.mock('../api/dishesApi');
vi.mocked(createDish).mockResolvedValue({ id: 1, name: 'Pizza' });

// Mock context/hooks
vi.mock('../../../context/useAuth');
vi.mocked(useAuth).mockReturnValue({ accessToken: 'token' });

// Mock external libraries
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() }
}));
```

### 4. Clean Up Between Tests

```typescript
beforeEach(() => {
  vi.clearAllMocks();  // Clear mock calls
  vi.restoreAllMocks(); // Restore original implementations
});
```

## Test Coverage

Run coverage to see which code is tested:

```bash
npm run test:coverage
```

View the HTML report at `coverage/index.html`.

## Common Patterns

### Testing Async Operations

```typescript
it('submits form successfully', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();

  render(<MyForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText('Name'), 'John');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({ name: 'John' });
  });
});
```

### Testing Error States

```typescript
it('shows error when submission fails', async () => {
  const user = userEvent.setup();
  vi.mocked(submitData).mockRejectedValue(new Error('API Error'));

  render(<MyForm />);

  await user.click(screen.getByRole('button', { name: 'Submit' }));

  await waitFor(() => {
    expect(screen.getByText('API Error')).toBeInTheDocument();
  });
});
```

### Testing Conditional Rendering

```typescript
it('shows modal when button clicked', async () => {
  const user = userEvent.setup();
  render(<ComponentWithModal />);

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Open' }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
