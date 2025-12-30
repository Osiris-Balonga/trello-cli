import { Command } from 'commander';
import ora from 'ora';
import { writeFile } from 'fs/promises';
import { loadCache } from '../utils/load-cache.js';
import { createTrelloClient } from '../utils/create-client.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloError, TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import {
  exportToJson,
  exportToCsv,
  exportToMarkdown,
  exportToHtml,
} from '../utils/exporters/index.js';

type ExportFormat = 'json' | 'csv' | 'md' | 'html';

interface ExportOptions {
  output?: string;
  list?: string;
}

export function createExportCommand(): Command {
  const exportCmd = new Command('export');

  exportCmd
    .description('Export cards to various formats')
    .argument('<format>', 'Export format (json, csv, md, html)')
    .option('-o, --output <file>', 'Output file (stdout if omitted)')
    .option('--list <alias>', 'Filter by list (todo/doing/done)')
    .action(async (format: string, options: ExportOptions) => {
      await handleExport(format as ExportFormat, options);
    });

  return exportCmd;
}

async function handleExport(
  format: ExportFormat,
  options: ExportOptions
): Promise<void> {
  try {
    const validFormats = ['json', 'csv', 'md', 'html'];
    if (!validFormats.includes(format)) {
      throw new TrelloValidationError(
        t('export.invalidFormat', { formats: validFormats.join(', ') }),
        'format'
      );
    }

    const cache = await loadCache();
    const boardId = cache.getBoardId();

    if (!boardId) {
      throw new TrelloError(t('errors.cacheNotFound'), 'NOT_INITIALIZED');
    }

    const spinner = ora(t('export.exporting')).start();
    const client = await createTrelloClient();

    let cards = await client.cards.listByBoard(boardId);

    if (options.list) {
      const list = cache.getListByAlias(options.list);
      if (!list) {
        spinner.fail(t('export.invalidList', { list: options.list }));
        return;
      }
      cards = cards.filter((card) => card.idList === list.id);
    }

    let content: string;
    switch (format) {
      case 'json':
        content = exportToJson(cards, cache);
        break;
      case 'csv':
        content = exportToCsv(cards, cache);
        break;
      case 'md':
        content = exportToMarkdown(cards, cache);
        break;
      case 'html':
        content = exportToHtml(cards, cache);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    if (options.output) {
      await writeFile(options.output, content, 'utf-8');
      spinner.succeed(t('export.success', { file: options.output }));
    } else {
      spinner.stop();
      console.log(content);
    }
  } catch (error) {
    handleCommandError(error);
  }
}
