import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '@/utils/errorHandler';

describe('getErrorMessage', () => {
  it('returns default message for undefined error', () => {
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });

  it('returns default message for null error', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
  });

  it('returns custom fallback message', () => {
    expect(getErrorMessage(undefined, 'Custom error')).toBe('Custom error');
  });

  it('extracts message from Error object', () => {
    const error = new Error('Something went wrong');
    expect(getErrorMessage(error)).toBe('Something went wrong');
  });

  it('extracts message from error with response property', () => {
    const error = {
      response: {
        data: {
          message: 'Validation failed',
        },
      },
    };
    expect(getErrorMessage(error)).toBe('Validation failed');
  });

  it('handles error with response but no message', () => {
    const error = {
      response: {
        data: {},
      },
    };
    expect(getErrorMessage(error, 'Fallback')).toBe('Fallback');
  });

  it('handles error with response but no data', () => {
    const error = {
      response: {},
    };
    expect(getErrorMessage(error, 'Fallback')).toBe('Fallback');
  });

  it('handles plain object without response', () => {
    const error = { message: 'Plain error' };
    expect(getErrorMessage(error, 'Fallback')).toBe('Fallback');
  });

  it('handles string error (non-standard)', () => {
    const error = 'String error' as never;
    expect(getErrorMessage(error, 'Fallback')).toBe('Fallback');
  });

  it('prefers response.data.message over Error.message', () => {
    const apiError = {
      response: {
        data: { message: 'API error' },
      },
      message: 'Local error',
    } as never;
    expect(getErrorMessage(apiError)).toBe('API error');
  });
});
