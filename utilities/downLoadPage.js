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

const downloadResource = (url, filePath) => {
  return axios
    .get(url, { responseType: 'arraybuffer' })
    .then((response) => fs.writeFile(filePath, response.data))
    .then(() => log(`Downloaded: ${url}`))
    .catch((err) => Promise.reject(new Error(`Failed to download ${url}: ${err.message}`)));
};

const downloadPage = (pageUrl, outputDir = process.cwd()) => {
  log(`Starting download for: ${pageUrl}`);
  const baseName = generateFileName(pageUrl);
  const htmlFileName = `${baseName}.html`;
  const resourcesDir = `${baseName}_files`;
  const htmlFilePath = path.join(outputDir, htmlFileName);
  const resourcesPath = path.join(outputDir, resourcesDir);

  return axios
    .get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })
    .then((response) => {
      log(`Received response from ${pageUrl}`);
      return fs.mkdir(resourcesPath, { recursive: true }).then(() => response.data);
    })
    .then((html) => {
      const $ = cheerio.load(html);
      const tasks = new Listr([], { concurrent: true });

      return fs.readdir(resourcesPath).catch(() => []).then(() => {
        $('img, link[rel="stylesheet"], script[src]').each((_, element) => {
          const tag = element.tagName;
          const attr = tag === 'link' ? 'href' : 'src';
          const resourceUrl = new URL($(element).attr(attr), pageUrl).href;
          const resourceName = generateFileName(resourceUrl) + path.extname(resourceUrl);
          const resourcePath = path.join(resourcesPath, resourceName);

          $(element).attr(attr, path.join(resourcesDir, resourceName));

          tasks.add({
            title: resourceUrl,
            task: () => downloadResource(resourceUrl, resourcePath),
          });
        });

        return tasks.run().then(() => $);
      });
    })
    .then(($) => fs.writeFile(htmlFilePath, $.html()))
    .then(() => {
      console.log(`\nPage was successfully downloaded into '${chalk.bold(htmlFilePath)}'`);
      return htmlFilePath;
    })
    .catch((err) => {
      log(`Error downloading page: ${err.message}`);
      console.error(chalk.red(`Error: ${err.message}`));
      return Promise.reject(err);
    });
};

export default downloadPage;
