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

/**
 * Gère les erreurs des commandes CLI de manière centralisée.
 * Affiche un message approprié selon le type d'erreur et termine le processus.
 *
 * @param error - L'erreur à gérer
 * @param context - Contexte optionnel (commande, opération)
 */
export function handleCommandError(
  error: unknown,
  _context?: ErrorContext
): never {
  logger.newline();

  // Erreur d'authentification
  if (error instanceof TrelloAuthError) {
    logger.error("Erreur d'authentification");
    logger.info(error.message);
    logger.hint('\nExécutez: tt auth apikey');
    process.exit(1);
  }

  // Erreur de rate limiting
  if (error instanceof TrelloRateLimitError) {
    logger.error('Limite de requêtes API dépassée');
    logger.info(error.message);
    logger.hint('\nPatientez quelques secondes puis réessayez.');
    process.exit(1);
  }

  // Erreur de validation
  if (error instanceof TrelloValidationError) {
    logger.error('Erreur de validation');
    logger.info(error.message);
    if (error.field) {
      logger.hint(`\nChamp concerné: ${error.field}`);
    }
    process.exit(1);
  }

  // Ressource non trouvée
  if (error instanceof TrelloNotFoundError) {
    logger.error(error.message);
    logger.hint('\nVérifiez votre configuration avec: tt config');
    logger.hint('Ou rafraîchissez le cache avec: tt sync');
    process.exit(1);
  }

  // Erreur API générique
  if (error instanceof TrelloAPIError) {
    logger.error('Erreur API Trello');
    logger.info(`[${error.statusCode}] ${error.message}`);

    if (error.details && process.env.DEBUG) {
      logger.debug('Détails:', error.details);
    }

    process.exit(1);
  }

  // Erreur Trello générique
  if (error instanceof TrelloError) {
    logger.error(`[${error.code || 'ERROR'}] ${error.message}`);

    if (error.statusCode) {
      logger.hint(`Code HTTP: ${error.statusCode}`);
    }

    process.exit(1);
  }

  // Erreur JavaScript standard
  if (error instanceof Error) {
    logger.error('Erreur inattendue');
    logger.info(error.message);

    if (process.env.DEBUG === 'true' && error.stack) {
      logger.newline();
      console.error(chalk.gray(error.stack));
    } else {
      logger.hint('\nActivez DEBUG=true pour plus de détails.');
    }

    process.exit(1);
  }

  // Erreur inconnue
  logger.error('Erreur inconnue');
  logger.info(String(error));
  process.exit(1);
}

/**
 * Wrapper pour exécuter une fonction avec gestion d'erreurs.
 * Utile pour les opérations asynchrones.
 *
 * @param fn - Fonction à exécuter
 * @param context - Contexte pour les messages d'erreur
 */
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
