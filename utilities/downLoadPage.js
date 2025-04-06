import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import debug from 'debug';
import chalk from 'chalk';
import { Listr } from 'listr2';

const log = debug('hexlet:page-loader');

export const generateFileName = (url) => {
  const { hostname, pathname } = new URL(url);
  const pathWithoutExt = pathname.replace(path.extname(pathname), '');
  const host = hostname.replace(/\W/g, '-');
  const cleanPath = pathWithoutExt.replace(/\W/g, '-').replace(/-$/, '');
  return `${host}${cleanPath || ''}`;
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
      throw new Error(`Failed to download ${url}: ${err.message}`);
    });
};

const downloadPage = async (pageUrl, outputDir = process.cwd()) => {
  try {
    const stats = await fs.stat(outputDir);
    if (!stats.isDirectory()) {
      throw new Error('Output path is not a directory');
    }

    const baseName = generateFileName(pageUrl);
    const htmlFileName = `${baseName}.html`;
    const resourcesDir = `${baseName}_files`;
    const htmlFilePath = path.join(outputDir, htmlFileName);
    const resourcesPath = path.join(outputDir, resourcesDir);

    const response = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      validateStatus: (status) => status < 400,
    });

    log(`Received response from ${pageUrl}`);
    await fs.mkdir(resourcesPath, { recursive: true });

    const $ = cheerio.load(response.data);
    const tasks = new Listr([], {
      concurrent: true,
      exitOnError: false,
    });

    const pageHost = new URL(pageUrl).hostname;

    $('img, link[rel="stylesheet"], script[src]').each((_, element) => {
      const tagName = $(element)[0].tagName;
      const attr = tagName === 'link' ? 'href' : 'src';
      const resourceAttr = $(element).attr(attr);

      if (!resourceAttr) return;

      let resourceUrl;
      try {
        resourceUrl = new URL(resourceAttr, pageUrl);
      } catch {
        log(`Skipping invalid URL: ${resourceAttr}`);
        return;
      }

      if (resourceUrl.hostname !== pageHost) {
        return; // skip external resources
      }

      const resourceName = generateFileName(resourceUrl.href) + path.extname(resourceUrl.pathname);
      const resourcePath = path.join(resourcesPath, resourceName);

      $(element).attr(attr, path.posix.join(resourcesDir, resourceName));

      tasks.add({
        title: `Downloading ${resourceUrl.href}`,
        task: () => downloadResource(resourceUrl.href, resourcePath)
          .catch((err) => {
            log(err.message);
            throw err;
          }),
      });
    });

    await tasks.run();
    await fs.writeFile(htmlFilePath, $.html());

    console.log(`\nPage was successfully downloaded into '${chalk.bold.redBright(htmlFilePath)}'`);
    return htmlFilePath;
  } catch (error) {
    log(`Error downloading page: ${error.message}`);
    console.error(chalk.red(`Error: ${error.message}`));
    throw error;
  }
};

export default downloadPage;
