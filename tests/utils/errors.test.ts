import { describe, it, expect } from 'vitest';
import {
  TrelloError,
  TrelloNetworkError,
  TrelloAPIError,
  TrelloAuthError,
  TrelloNotFoundError,
  TrelloValidationError,
  TrelloRateLimitError,
} from '../../src/utils/errors.js';

describe('TrelloError', () => {
  it('creates error with message only', () => {
    const error = new TrelloError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.code).toBeUndefined();
    expect(error.statusCode).toBeUndefined();
    // TrelloError is now an alias for TaskPilotError
    expect(error.name).toBe('TaskPilotError');
  });

  it('creates error with code', () => {
    const error = new TrelloError('Test error', 'TEST_CODE');
    expect(error.code).toBe('TEST_CODE');
  });

  it('creates error with status code', () => {
    const error = new TrelloError('Test error', 'TEST', 500);
    expect(error.statusCode).toBe(500);
  });

  it('formats user message without code', () => {
    const error = new TrelloError('Test error');
    expect(error.toUserMessage()).toBe('Test error');
  });

  it('formats user message with code', () => {
    const error = new TrelloError('Test error', 'ERR_CODE');
    expect(error.toUserMessage()).toBe('[ERR_CODE] Test error');
  });
});

describe('TrelloNetworkError', () => {
  it('creates timeout error', () => {
    const error = new TrelloNetworkError(true, false);
    expect(error.message).toBe('Request timeout');
    expect(error.isTimeout).toBe(true);
    expect(error.isOffline).toBe(false);
    expect(error.code).toBe('NETWORK_ERROR');
  });

  it('creates offline error', () => {
    const error = new TrelloNetworkError(false, true);
    expect(error.message).toBe('Network unavailable');
    expect(error.isTimeout).toBe(false);
    expect(error.isOffline).toBe(true);
  });

  it('creates generic network error', () => {
    const error = new TrelloNetworkError(false, false);
    expect(error.message).toBe('Network error');
  });

  it('creates default network error', () => {
    const error = new TrelloNetworkError();
    expect(error.isTimeout).toBe(false);
    expect(error.isOffline).toBe(false);
    expect(error.message).toBe('Network error');
  });
});

describe('TrelloAPIError', () => {
  it('extracts message from axios response', () => {
    const axiosError = {
      response: {
        status: 400,
        data: { message: 'Bad request data' },
      },
      message: 'Fallback message',
    } as Parameters<typeof TrelloAPIError['prototype']['constructor']>[0];

    const error = new TrelloAPIError(axiosError);
    expect(error.message).toBe('Bad request data');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('API_ERROR');
    expect(error.details).toEqual({ message: 'Bad request data' });
  });

  it('uses axios message as fallback', () => {
    const axiosError = {
      response: {
        status: 500,
        data: {},
      },
      message: 'Request failed',
    } as Parameters<typeof TrelloAPIError['prototype']['constructor']>[0];

    const error = new TrelloAPIError(axiosError);
    expect(error.message).toBe('Request failed');
  });

  it('handles missing response data', () => {
    const axiosError = {
      response: {
        status: 503,
      },
      message: 'Service unavailable',
    } as Parameters<typeof TrelloAPIError['prototype']['constructor']>[0];

    const error = new TrelloAPIError(axiosError);
    expect(error.message).toBe('Service unavailable');
    expect(error.details).toBeUndefined();
  });
});

describe('TrelloAuthError', () => {
  it('creates with default message', () => {
    const error = new TrelloAuthError();
    expect(error.message).toBe('Authentication failed');
    expect(error.code).toBe('AUTH_ERROR');
    expect(error.statusCode).toBe(401);
  });

  it('creates with custom message', () => {
    const error = new TrelloAuthError('Invalid token');
    expect(error.message).toBe('Invalid token');
  });
});

describe('TrelloNotFoundError', () => {
  it('creates with resource name', () => {
    const error = new TrelloNotFoundError('Board "my-board"');
    expect(error.message).toBe('Board "my-board" not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });
});

describe('TrelloValidationError', () => {
  it('creates without field', () => {
    const error = new TrelloValidationError('Invalid input');
    expect(error.message).toBe('Invalid input');
    expect(error.field).toBeUndefined();
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
  });

  it('creates with field name', () => {
    const error = new TrelloValidationError('Title is required', 'title');
    expect(error.field).toBe('title');
  });
});

describe('TrelloRateLimitError', () => {
  it('creates without retry-after', () => {
    const error = new TrelloRateLimitError();
    expect(error.message).toBe('Rate limit exceeded');
    expect(error.code).toBe('RATE_LIMIT');
    expect(error.statusCode).toBe(429);
  });

  it('creates with retry-after', () => {
    const error = new TrelloRateLimitError(30);
    expect(error.message).toBe('Rate limit exceeded. Retry after 30s');
  });
});
