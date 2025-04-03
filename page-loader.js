#!/usr/bin/env node

import { program } from 'commander';
import downloadPage from './utilities/downLoadPage.js';
import debug from 'debug';

const log = debug('hexlet:page-loader');

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


program.exitOverride();

program.parse();
