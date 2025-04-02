import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import debug from 'debug';
import chalk from 'chalk';
import { Listr } from 'listr2';

const log = debug('hexlet:page-loader');

export const generateFileName = (url) => {
  const urlObj = new URL(url);
  const host = urlObj.hostname.replace(/\W/g, '-');
  const pathname = urlObj.pathname.replace(/\W/g, '-');
  return `${host}${pathname || ''}`;
};

const downloadResource = async (url, filePath) => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.writeFile(filePath, response.data);
    log(`Downloaded: ${url}`);
  } catch (err) {
    throw new Error(`Failed to download ${url}: ${err.message}`);
  }
};

const downloadPage = async (pageUrl, outputDir = process.cwd()) => {
  log(`Starting download for: ${pageUrl}`);
  const baseName = generateFileName(pageUrl);
  const htmlFileName = `${baseName}.html`;
  const resourcesDir = `${baseName}_files`;
  const htmlFilePath = path.join(outputDir, htmlFileName);
  const resourcesPath = path.join(outputDir, resourcesDir);

  try {
    const response = await axios.get(pageUrl);
    log(`Received response from ${pageUrl}`);
    await fs.mkdir(resourcesPath, { recursive: true });

    const $ = cheerio.load(response.data);
    const tasks = new Listr([], { concurrent: true });

    $('img, link[rel="stylesheet"], script[src]').each((_, element) => {
      const tag = element.tagName;
      const attr = tag === 'link' ? 'href' : 'src';
      const resourceUrl = new URL($(element).attr(attr), pageUrl).href;
      const resourceName = generateFileName(resourceUrl) + path.extname(resourceUrl);
      const resourcePath = path.join(resourcesPath, resourceName);

      $(element).attr(attr, path.join(resourcesDir, resourceName));

      tasks.add({
        title: resourceUrl,
        task: async () => downloadResource(resourceUrl, resourcePath),
      });
    });

    await tasks.run();
    await fs.writeFile(htmlFilePath, $.html());

    console.log(`\nPage was successfully downloaded into '${chalk.bold(htmlFilePath)}'`);
  } catch (err) {
    log(`Error downloading page: ${err.message}`);
    console.error(chalk.red(`Error: ${err.message}`));
  }
};

export default downloadPage;
