#!/usr/bin/env node

import { Command } from 'commander';
import downloadPage from '../utilities/downLoadPage.js';
import debug from 'debug';
import chalk from 'chalk';

const log = debug('hexlet:page-loader');

function run() {
  const program = new Command();

  program
    .name('page-loader')
    .description('Page loader utility')
    .version('1.0.0', '-v, --version')
    .argument('<url>')
    .option('-o, --output <dir>', 'Output directory', process.cwd())
    .action((url, options) => {
      log(`Processing ${url}`);
      return downloadPage(url, options.output)
        .catch((error) => {
          console.error(chalk.red(`Error: ${error.message}`));
          process.exitCode = 1;
          throw error;
        });
    });

  return program.parseAsync(process.argv)
    .catch(() => {
      process.exitCode = 1;
    });
}

run();

export default run;
