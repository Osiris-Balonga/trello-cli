/* eslint-disable no-console */
import chalk from 'chalk';
import {
  TrelloError,
  TrelloAuthError,
  TrelloNotFoundError,
  TrelloValidationError,
  TrelloRateLimitError,
  TrelloAPIError,
} from './errors.js';
import { logger } from './logger.js';

interface ErrorContext {
  command?: string;
  operation?: string;
}

export function handleCommandError(
  error: unknown,
  _context?: ErrorContext
): never {
  logger.newline();

  if (error instanceof TrelloAuthError) {
    logger.error('Authentication error');
    logger.info(error.message);
    logger.hint('\nRun: tt auth apikey');
    process.exit(1);
  }

  if (error instanceof TrelloRateLimitError) {
    logger.error('API rate limit exceeded');
    logger.info(error.message);
    logger.hint('\nWait a few seconds and try again.');
    process.exit(1);
  }

  if (error instanceof TrelloValidationError) {
    logger.error('Validation error');
    logger.info(error.message);
    if (error.field) {
      logger.hint(`\nField: ${error.field}`);
    }
    process.exit(1);
  }

  if (error instanceof TrelloNotFoundError) {
    logger.error(error.message);
    logger.hint('\nCheck your configuration with: tt config');
    logger.hint('Or refresh the cache with: tt sync');
    process.exit(1);
  }

  if (error instanceof TrelloAPIError) {
    logger.error('Trello API error');
    logger.info(`[${error.statusCode}] ${error.message}`);

    if (error.details && process.env.DEBUG) {
      logger.debug('Details:', error.details);
    }

    process.exit(1);
  }

  if (error instanceof TrelloError) {
    logger.error(`[${error.code || 'ERROR'}] ${error.message}`);

    if (error.statusCode) {
      logger.hint(`HTTP code: ${error.statusCode}`);
    }

    process.exit(1);
  }

  if (error instanceof Error) {
    logger.error('Unexpected error');
    logger.info(error.message);

    if (process.env.DEBUG === 'true' && error.stack) {
      logger.newline();
      console.error(chalk.gray(error.stack));
    } else {
      logger.hint('\nSet DEBUG=true for more details.');
    }

    process.exit(1);
  }

  logger.error('Unknown error');
  logger.info(String(error));
  process.exit(1);
}

export async function withErrorHandler<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    handleCommandError(error, context);
  }
}
