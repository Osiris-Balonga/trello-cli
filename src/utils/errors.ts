import type { AxiosError } from 'axios';

export class TrelloError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'TrelloError';

    // Stack trace uniquement en développement (sécurité)
    if (process.env.NODE_ENV !== 'production') {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Format sécurisé pour l'affichage utilisateur
  toUserMessage(): string {
    return this.code ? `[${this.code}] ${this.message}` : this.message;
  }
}

export class TrelloAPIError extends TrelloError {
  public readonly details?: Record<string, unknown>;

  constructor(axiosError: AxiosError<{ message?: string }>) {
    const message =
      axiosError.response?.data?.message ||
      axiosError.message ||
      'Unknown API error';
    const statusCode = axiosError.response?.status;

    super(message, 'API_ERROR', statusCode);

    // Stocker les détails séparément (pas dans le message)
    if (axiosError.response?.data) {
      this.details = axiosError.response.data as Record<string, unknown>;
    }
  }
}

export class TrelloAuthError extends TrelloError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class TrelloNotFoundError extends TrelloError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class TrelloValidationError extends TrelloError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class TrelloRateLimitError extends TrelloError {
  constructor(retryAfter?: number) {
    super(
      `Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter}s` : ''}`,
      'RATE_LIMIT',
      429
    );
  }
}
