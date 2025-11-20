export function getErrorMessage(error: unknown, fallback: string = 'An unexpected error occurred'): string {
  let message = fallback;

  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    message = response?.data?.message ?? message;
  } else if (error instanceof Error && error.message) {
    message = error.message;
  }

  return message;
}
