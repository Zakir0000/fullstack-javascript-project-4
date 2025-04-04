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
  const pathname = urlObj.pathname.replace(/\W/g, '-').replace(/-$/, '');
  return `${host}${pathname || ''}`;
};

const downloadResource = (url, filePath) => {
  return axios.get(url, {
    responseType: 'arraybuffer',
    validateStatus: (status) => status < 400
  }).then((response) => {
    return fs.writeFile(filePath, response.data);
  }).then(() => {
    log(`Downloaded: ${url}`);
    return true;
  }).catch((err) => {
    throw new Error(`Failed to download ${url}: ${err.message}`);
  });
};

const downloadPage = (pageUrl, outputDir = process.cwd()) => {
  let baseName;
  try {
    baseName = generateFileName(pageUrl);
  } catch (error) {
    return Promise.reject(error);
  }

  const htmlFileName = `${baseName}.html`;
  const resourcesDir = `${baseName}_files`;
  const htmlFilePath = path.join(outputDir, htmlFileName);
  const resourcesPath = path.join(outputDir, resourcesDir);

  return axios.get(pageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
    validateStatus: (status) => status < 400
  }).then((response) => {
    log(`Received response from ${pageUrl}`);
    return fs.mkdir(resourcesPath, { recursive: true })
      .then(() => response.data);
  }).then((html) => {
    const $ = cheerio.load(html);
    const tasks = new Listr([], { 
      concurrent: true,
      exitOnError: true
    });

    $('img, link[rel="stylesheet"], script[src]').each((_, element) => {
      const tag = element.tagName;
      const attr = tag === 'link' ? 'href' : 'src';
      const resourceUrl = new URL($(element).attr(attr), pageUrl).href;
      const resourceName = generateFileName(resourceUrl) + path.extname(resourceUrl);
      const resourcePath = path.join(resourcesPath, resourceName);

      $(element).attr(attr, path.join(resourcesDir, resourceName));

      tasks.add({
        title: resourceUrl,
        task: () => downloadResource(resourceUrl, resourcePath)
          .catch(err => {
            log(err.message);
            throw err;
          })
      });
    });

    return tasks.run().then(() => $);
  }).then(($) => {
    return fs.writeFile(htmlFilePath, $.html());
  }).then(() => {
    console.log(`\nPage was successfully downloaded into '${chalk.bold(htmlFilePath)}'`);
    return htmlFilePath;
  }).catch((error) => {
    log(`Error downloading page: ${error.message}`);
    console.error(chalk.red(`Error: ${error.message}`));
    throw error;
  });
};

export default downloadPage;