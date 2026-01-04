import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EditIcon, DeleteIcon, HomeIcon } from '@/components/Icons';

describe('Icons', () => {
  it('renders EditIcon with default class', () => {
    const { container } = render(<EditIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveClass('h-5', 'w-5');
  });

  it('renders EditIcon with custom class', () => {
    const { container } = render(<EditIcon className="h-10 w-10" />);
    expect(container.querySelector('svg')).toHaveClass('h-10', 'w-10');
  });

  it('renders EditIcon with aria-hidden', () => {
    const { container } = render(<EditIcon aria-hidden />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders DeleteIcon', () => {
    const { container } = render(<DeleteIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders HomeIcon', () => {
    const { container } = render(<HomeIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('has correct SVG attributes', () => {
    const { container } = render(<EditIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });
});
