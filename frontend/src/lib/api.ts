export type ApiError = {
  message: string;
};

export class HttpError extends Error {
  status: number;
  payload?: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    accessToken?: string | null;
  },
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options?.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    },
    credentials: "include",
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    throw new HttpError(response.status, getErrorMessage(payload, response.statusText), payload);
  }

  return payload as T;
}
