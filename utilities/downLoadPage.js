import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import debug from 'debug';
import chalk from 'chalk';
import { Listr } from 'listr2';

const log = debug('hexlet:page-loader');

export const generateFileName = (url) => {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.replace(/\W/g, '-');
    const pathname = urlObj.pathname.replace(/\W/g, '-').replace(/-$/, '');
    return `${host}${pathname || ''}`;
  } catch (error) {
    return Promise.reject(new Error(`Invalid URL: ${error.message}`));
  }
};

const downloadResource = (url, filePath) => {
  return axios.get(url, {
    responseType: 'arraybuffer',
    validateStatus: (status) => status < 400
  })
    .then((response) => fs.writeFile(filePath, response.data))
    .then(() => {
      log(`Downloaded: ${url}`);
      return true;
    })
    .catch((err) => {
      return Promise.reject(new Error(`Failed to download ${url}: ${err.message}`));
    });
};

const downloadPage = (pageUrl, outputDir = process.cwd()) => {
  let baseName;
  let htmlFileName;
  let resourcesDir;
  let htmlFilePath;
  let resourcesPath;

  return Promise.resolve()
    .then(() => generateFileName(pageUrl))
    .then((name) => {
      baseName = name;
      htmlFileName = `${baseName}.html`;
      resourcesDir = `${baseName}_files`;
      htmlFilePath = path.join(outputDir, htmlFileName);
      resourcesPath = path.join(outputDir, resourcesDir);

      return fs.access(outputDir, fs.constants.W_OK);
    })
    .then(() => axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      validateStatus: (status) => status < 400
    }))
    .then((response) => {
      log(`Received response from ${pageUrl}`);
      return fs.mkdir(resourcesPath, { recursive: true })
        .then(() => response.data);
    })
    .then((html) => {
      const $ = cheerio.load(html);
      const tasks = new Listr([], {
        concurrent: true,
        exitOnError: false
      });

      const resources = $('img, link[rel="stylesheet"], script[src]');
      if (resources.length === 0) {
        log('No resources found to download');
      }

      resources.each((_, element) => {
        const tag = element.tagName;
        const attr = tag === 'link' ? 'href' : 'src';
        const resourceUrl = $(element).attr(attr);

        if (!resourceUrl) return;

        try {
          const fullResourceUrl = new URL(resourceUrl, pageUrl).href;
          const resourceName = generateFileName(fullResourceUrl) + path.extname(new URL(fullResourceUrl).pathname);
          const resourcePath = path.join(resourcesPath, resourceName);

          $(element).attr(attr, path.join(resourcesDir, resourceName));

          tasks.add({
            title: fullResourceUrl,
            task: () => downloadResource(fullResourceUrl, resourcePath)
              .catch(err => {
                log(`Skipping resource: ${err.message}`);
                return null;
              })
          });
        } catch (err) {
          log(`Skipping invalid resource URL: ${resourceUrl} - ${err.message}`);
        }
      });

      return tasks.run()
        .then(() => $);
    })
    .then(($) => fs.writeFile(htmlFilePath, $.html()))
    .then(() => {
      console.log(`\nPage was successfully downloaded into '${chalk.bold(htmlFilePath)}'`);
      return htmlFilePath;
    })
    .catch((error) => {
      const message = error.response
        ? `HTTP Error ${error.response.status}: ${error.response.statusText}`
        : error.message;

      log(`Error downloading page: ${message}`);
      return Promise.reject(new Error(message));
    });
};

export default downloadPage;