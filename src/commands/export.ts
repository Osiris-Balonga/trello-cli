import { Command } from 'commander';
import ora from 'ora';
import { writeFile } from 'fs/promises';
import { withBoardContext } from '../utils/command-context.js';
import { handleCommandError } from '../utils/error-handler.js';
import { TrelloValidationError } from '../utils/errors.js';
import { t } from '../utils/i18n.js';
import { logger } from '../utils/logger.js';
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
    .description(t('cli.commands.export'))
    .argument('<format>', t('cli.arguments.format'))
    .option('-o, --output <file>', t('cli.options.output'))
    .option('--list <alias>', t('cli.options.list'))
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

    const spinner = ora(t('export.exporting')).start();

    await withBoardContext(async ({ cache, client, boardId }) => {
      let cards = await client.cards.listByBoard(boardId);

      if (options.list) {
        const list = cache.getListByName(options.list);
        if (!list) {
          const availableLists = cache
            .getAllLists()
            .map((l) => l.name)
            .join(', ');
          spinner.fail(
            t('export.invalidList', { list: options.list }) +
              ` (${t('common.available')}: ${availableLists})`
          );
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
        logger.print(content);
      }
    });
  } catch (error) {
    handleCommandError(error);
  }
}
