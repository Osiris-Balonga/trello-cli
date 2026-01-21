import type { AxiosError } from 'axios';

export class TaskPilotError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'TaskPilotError';

    if (process.env.NODE_ENV !== 'production') {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toUserMessage(): string {
    return this.code ? `[${this.code}] ${this.message}` : this.message;
  }
}

export class TaskPilotNetworkError extends TaskPilotError {
  constructor(
    public readonly isTimeout: boolean = false,
    public readonly isOffline: boolean = false
  ) {
    const message = isTimeout
      ? 'Request timeout'
      : isOffline
        ? 'Network unavailable'
        : 'Network error';
    super(message, 'NETWORK_ERROR');
  }
}

export class TaskPilotAPIError extends TaskPilotError {
  public readonly details?: Record<string, unknown>;

  constructor(axiosError: AxiosError<{ message?: string }>) {
    const message =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Unknown API error';
    const statusCode = axiosError.response?.status;

    super(message, 'API_ERROR', statusCode);

    if (axiosError.response?.data) {
      this.details = axiosError.response.data as Record<string, unknown>;
    }
  }
}

export class TaskPilotAuthError extends TaskPilotError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class TaskPilotNotFoundError extends TaskPilotError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class TaskPilotValidationError extends TaskPilotError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class TaskPilotRateLimitError extends TaskPilotError {
  constructor(retryAfter?: number) {
    super(
      `Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
      'RATE_LIMIT',
      429
    );
  }
}

// Backwards compatibility aliases (for Trello provider)
export const TrelloError = TaskPilotError;
export const TrelloNetworkError = TaskPilotNetworkError;
export const TrelloAPIError = TaskPilotAPIError;
export const TrelloAuthError = TaskPilotAuthError;
export const TrelloNotFoundError = TaskPilotNotFoundError;
export const TrelloValidationError = TaskPilotValidationError;
export const TrelloRateLimitError = TaskPilotRateLimitError;

// GitHub provider aliases
export const GitHubError = TaskPilotError;
export const GitHubNetworkError = TaskPilotNetworkError;
export const GitHubAPIError = TaskPilotAPIError;
export const GitHubAuthError = TaskPilotAuthError;
export const GitHubNotFoundError = TaskPilotNotFoundError;
export const GitHubValidationError = TaskPilotValidationError;
export const GitHubRateLimitError = TaskPilotRateLimitError;
