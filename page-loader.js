#!/usr/bin/env node

import { program } from 'commander';
import downloadPage from './utilities/downLoadPage.js';
import debug from 'debug';

const log = debug('page-loader');

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .argument('<url>', 'URL страницы для загрузки')
  .option('-o, --output <dir>', 'Output directory', process.cwd())
  .action((url, options) => {
    log(`Running page-loader for ${url} with output directory: ${options.output}`);
    return downloadPage(url, options.output);
  });

// Only run the CLI parser if this file is executed directly.
if (process.argv[1] === new URL(import.meta.url).pathname) {
  program.exitOverride();
  program.parseAsync().catch(err => {
    // Print the error and exit with the specified exit code.
    console.error(err);
    process.exit(err.exitCode || 1);
  });
}

export default downloadPage;
