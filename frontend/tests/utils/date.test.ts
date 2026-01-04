import { describe, it, expect } from 'vitest';
import { formatDisplayDate } from '@/utils/date';

describe('formatDisplayDate', () => {
  it('returns "Date TBD" for undefined input', () => {
    expect(formatDisplayDate(undefined)).toBe('Date TBD');
  });

  it('returns "Date TBD" for null input', () => {
    expect(formatDisplayDate(null as never)).toBe('Date TBD');
  });

  it('returns "Date TBD" for empty string', () => {
    expect(formatDisplayDate('')).toBe('Date TBD');
  });

  it('formats valid ISO date string', () => {
    const date = '2024-01-15T10:30:00.000Z';
    const result = formatDisplayDate(date);
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('formats date with locale', () => {
    const date = '2024-12-25T00:00:00.000Z';
    const result = formatDisplayDate(date);
    expect(result).toContain('2024');
    expect(result).toContain('Dec');
    expect(result).toContain('25');
  });

  it('returns original string for invalid date', () => {
    const invalidDate = 'not-a-date';
    expect(formatDisplayDate(invalidDate)).toBe('not-a-date');
  });

  it('handles leap year dates', () => {
    const date = '2024-02-29T00:00:00.000Z';
    const result = formatDisplayDate(date);
    expect(result).toContain('2024');
    expect(result).toContain('2');
    expect(result).toContain('29');
  });
});
