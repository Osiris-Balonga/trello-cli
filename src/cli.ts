import { Command } from 'commander';

const program = new Command();

program
  .name('tt')
  .description('CLI moderne pour gérer Trello depuis le terminal')
  .version('1.0.0');

// Les commandes seront ajoutées ici dans les prochaines tasks

program.parse();
