/* eslint-disable no-console */
import chalk from 'chalk';

type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error';

interface LoggerOptions {
  debug?: boolean;
  silent?: boolean;
}

class Logger {
  private debugMode: boolean;
  private silentMode: boolean;

  constructor(options: LoggerOptions = {}) {
    this.debugMode = options.debug ?? process.env.DEBUG === 'true';
    this.silentMode = options.silent ?? false;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (this.silentMode && level !== 'error') return;

    const formatted =
      args.length > 0
        ? `${message} ${args.map((a) => JSON.stringify(a)).join(' ')}`
        : message;

    switch (level) {
      case 'debug':
        if (this.debugMode) {
          console.log(chalk.gray(`[DEBUG] ${formatted}`));
        }
        break;
      case 'info':
        console.log(chalk.white(formatted));
        break;
      case 'success':
        console.log(chalk.green(`✓ ${formatted}`));
        break;
      case 'warn':
        console.log(chalk.yellow(`⚠ ${formatted}`));
        break;
      case 'error':
        console.error(chalk.red(`✗ ${formatted}`));
        break;
    }
  }

  // Méthodes publiques
  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  success(message: string, ...args: unknown[]): void {
    this.log('success', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }

  // Affichage de titre/section
  title(message: string): void {
    console.log(chalk.bold(`\n${message}\n`));
  }

  // Affichage de hint/aide
  hint(message: string): void {
    console.log(chalk.gray(message));
  }

  // Ligne vide
  newline(): void {
    console.log('');
  }

  // Configuration
  setDebug(enabled: boolean): void {
    this.debugMode = enabled;
  }

  setSilent(enabled: boolean): void {
    this.silentMode = enabled;
  }
}

// Instance singleton
export const logger = new Logger();

// Export de la classe pour les tests
export { Logger };
