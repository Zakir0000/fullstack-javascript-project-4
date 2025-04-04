#!/usr/bin/env node

import { program } from 'commander';
import downloadPage from './utilities/downLoadPage.js';
import debug from 'debug';

const log = debug('hexlet:page-loader');

// Main function to run the program
async function run() {
  try {
    return program
      .name('page-loader')
      .description('Page loader utility')
      .version('1.0.0')
      .argument('<url>', 'URL страницы для загрузки')
      .option('-o, --output <dir>', 'Output directory', process.cwd())
      .action(async (url, options) => {
        log(`Running page-loader for ${url} with output directory: ${options.output}`);
        await downloadPage(url, options.output); // Assuming downloadPage is async
      })
      .parseAsync();
  } catch (error) {
    console.error('An error occurred:', error.message);
    throw error;
  }
}

export default run;
