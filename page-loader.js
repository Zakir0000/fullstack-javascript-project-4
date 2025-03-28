#!/usr/bin/env node

import { program } from 'commander';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateFileName = (url) => {
  const urlObj = new URL(url);
  return `${urlObj.hostname.replace(/\W/g, '-')}${urlObj.pathname.replace(/\W/g, '-')}.html`;
};

const downloadPage = (url, outputDir = process.cwd()) => {
  const fileName = generateFileName(url);
  const filePath = path.join(outputDir, fileName);

  axios.get(url)
    .then(res => fs.outputFile(filePath, res.data))
    .then(() => {
      console.log(filePath);
      return filePath;
    })
    .catch(err => {
      console.error(`Download error ${url}:`, err.message);
      process.exit(1);
    });
};

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .argument('<url>', 'URL страницы для загрузки')
  .option('-o, --output [dir]', 'Output dir (default: "/home/user/current-dir")')
  .action((url, options) => {
    downloadPage(url, options.output || process.cwd());
  });

program.parse();
