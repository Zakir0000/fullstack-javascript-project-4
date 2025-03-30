#!/usr/bin/env node

import { program } from 'commander';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import downloadPage from './utilities/downLoadPage';

const generateFileName = (url) => {
  const urlObj = new URL(url);
  const host = urlObj.hostname.replace(/\W/g, '-');
  const pathname = urlObj.pathname === '/' ? '' : urlObj.pathname.replace(/\W/g, '-');
  return `${host}${pathname}.html`;
};

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
