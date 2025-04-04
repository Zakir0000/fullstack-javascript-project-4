#!/usr/bin/env node

import { program } from 'commander';
import downloadPage from './utilities/downLoadPage.js';
import debug from 'debug';

const log = debug('hexlet:page-loader');

// Main function to run the program
async function run() {
  try {
    program
      .name('page-loader')
      .description('Page loader utility')
      .version('1.0.0')
      .argument('<url>', 'URL страницы для загрузки')
      .option('-o, --output <dir>', 'Output directory', process.cwd())
      .action(async (url, options) => {
        log(`Running page-loader for ${url} with output directory: ${options.output}`);
        await downloadPage(url, options.output); // Assuming downloadPage is async
      });

    program.parse();
  } catch (error) {
    console.error('An error occurred:', error.message);
    process.exit(1); // Exit with a non-zero status code in case of an error
  }
}

// Call the main function
run();
