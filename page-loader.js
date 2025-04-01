#!/usr/bin/env node

import { program } from 'commander';
import downloadPage from './utilities/downLoadPage.js';

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .argument('<url>', 'URL страницы для загрузки')
  .option('-o, --output <dir>', 'Output directory', process.cwd())
  .action((url, options) => {
    downloadPage(url, options.output);
  });

  program.parse();


export default downloadPage;
