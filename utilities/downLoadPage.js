import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import debug from 'debug';
import chalk from 'chalk';
import { Listr } from 'listr2';
import pretty from 'pretty';

const log = debug('hexlet:page-loader');

export const generateFileName = (url) => {
  const { hostname, pathname } = new URL(url);
  const fileName = path.basename(pathname);
  const ext = path.extname(pathname);

  if (!pathname || pathname === '/' || !fileName) {
    return hostname.replace(/\W/g, '-');
  }
  const pathWithoutExt = pathname.replace(ext, '');
  const cleanPath = pathWithoutExt
    .split('/')
    .map((part) => part.replace(/\W/g, '-'))
    .filter(Boolean)
    .join('-');

  return `${hostname.replace(/\W/g, '-')}-${cleanPath}`;
};

const downloadResource = (url, filePath) => axios.get(url, {
  responseType: 'arraybuffer',
  validateStatus: (status) => status < 400,
})
  .then((response) => fs.writeFile(filePath, response.data))
  .then(() => {
    log(`Downloaded: ${url}`);
    return true;
  })
  .catch((err) => {
    throw new Error(`Failed to download ${url}: ${err.message}`);
  });

const downloadPage = (pageUrl, outputDir = process.cwd()) => fs.stat(outputDir)
  .then((stats) => {
    if (!stats.isDirectory()) {
      throw new Error('Output path is not a directory');
    }

    const baseName = generateFileName(pageUrl);
    const htmlFileName = `${baseName}.html`;
    const resourcesDir = `${baseName}_files`;
    const htmlFilePath = path.join(outputDir, htmlFileName);
    const resourcesPath = path.join(outputDir, resourcesDir);
    const pageUrlObj = new URL(pageUrl);

    return axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      validateStatus: (status) => status < 400,
    })
      .then((response) => {
        log(`Received response from ${pageUrl}`);
        return fs.mkdir(resourcesPath, { recursive: true })
          .then(() => response.data);
      })
      .then((html) => {
        const $ = cheerio.load(html);
        const tasks = new Listr([], {
          concurrent: true,
          exitOnError: false,
        });

        // Handle all resource types
        $('img[src], link[rel="stylesheet"][href], script[src], link[rel="canonical"][href]').each((_, element) => {
          const tagName = element.tagName.toLowerCase();
          const attr = tagName === 'link' ? 'href' : 'src';
          const resourceAttr = $(element).attr(attr);
          if (!resourceAttr) return;

          let resourceUrl;
          try {
            resourceUrl = new URL(resourceAttr, pageUrl);
          } catch (err) {
            log(`Invalid URL skipped: ${resourceAttr}`);
            return;
          }

          // Check if resource is on the same domain (including subdomains)
          const isSameDomain = resourceUrl.hostname === pageUrlObj.hostname
            || resourceUrl.hostname.endsWith(`.${pageUrlObj.hostname}`);

          if (!isSameDomain) {
            return;
          }

          const ext = path.extname(resourceUrl.pathname)
            || (tagName === 'link' && $(element).attr('rel') === 'canonical' ? '.html' : '');
          const resourceName = `${generateFileName(resourceUrl.href)}${ext}`;
          const resourcePath = path.join(resourcesPath, resourceName);
          const relativePath = path.posix.join(resourcesDir, resourceName);

          $(element).attr(attr, relativePath);

          tasks.add({
            title: `Downloading ${resourceUrl.href}`,
            task: () => downloadResource(resourceUrl.href, resourcePath)
              .catch((err) => {
                log(err.message);
                throw err;
              }),
          });
        });

        const formattedHtml = pretty($.html(), {
          ocd: true,
          indent_size: 2,
          indent_inner_html: true,
        });

        return Promise.all([
          fs.writeFile(htmlFilePath, formattedHtml),
          tasks.run().catch(() => true),
        ]).then(() => htmlFilePath);
      })
      .then((resultFilePath) => {
        console.log(`\nPage was successfully downloaded into '${chalk.bold.redBright(resultFilePath)}'`);
        return resultFilePath;
      });
  })
  .catch((error) => {
    log(`Error downloading page: ${error.message}`);
    console.error(chalk.red(`Error: ${error.message}`));
    throw error;
  });

export default downloadPage;