import chalk from 'chalk';
import {
  TrelloError,
  TrelloAuthError,
  TrelloNotFoundError,
  TrelloValidationError,
  TrelloRateLimitError,
  TrelloAPIError,
  TrelloNetworkError,
} from './errors.js';
import { logger } from './logger.js';
import { t } from './i18n.js';

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
    logger.error(t('errors.auth.title'));
    logger.info(t('errors.notAuthenticated'));
    logger.hint('\n' + t('auth.status.runAuth'));
    process.exit(1);
  }

  if (error instanceof TrelloNetworkError) {
    if (error.isTimeout) {
      logger.error(t('errors.network.timeout'));
      logger.hint('\n' + t('errors.network.retryHint'));
    } else if (error.isOffline) {
      logger.error(t('errors.network.offline'));
      logger.hint('\n' + t('errors.network.checkConnection'));
    } else {
      logger.error(t('errors.networkError'));
      logger.hint('\n' + t('errors.network.checkConnection'));
    }
    process.exit(1);
  }

  if (error instanceof TrelloRateLimitError) {
    logger.error(t('errors.rateLimit.title'));
    logger.info(error.message);
    logger.hint('\n' + t('errors.rateLimit.hint'));
    process.exit(1);
  }

  if (error instanceof TrelloValidationError) {
    logger.error(t('errors.validation.title'));
    logger.info(error.message);
    if (error.field) {
      logger.hint(`\n${t('errors.validation.field')}: ${error.field}`);
    }
    process.exit(1);
  }

  if (error instanceof TrelloNotFoundError) {
    logger.error(error.message);
    logger.hint('\n' + t('errors.notFound.configHint'));
    logger.hint(t('errors.notFound.syncHint'));
    process.exit(1);
  }

  if (error instanceof TrelloAPIError) {
    logger.error(t('errors.api.title'));
    logger.info(t('errors.apiError', { message: `[${error.statusCode}] ${error.message}` }));

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
    logger.error(t('errors.unexpected.title'));
    logger.info(error.message);

    if (process.env.DEBUG === 'true' && error.stack) {
      logger.newline();
      logger.printError(chalk.gray(error.stack));
    } else {
      logger.hint('\n' + t('errors.unexpected.debugHint'));
    }

    process.exit(1);
  }

  logger.error(t('errors.unknownError'));
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
