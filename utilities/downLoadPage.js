import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

export const generateFileName = (url) => {
  const urlObj = new URL(url);
  const host = urlObj.hostname.replace(/\W/g, '-');
  const pathname = urlObj.pathname === '/' ? '' : urlObj.pathname.replace(/\W/g, '-');
  return `${host}${pathname}`;
};

const downloadPage = (url, outputDir = process.cwd()) => {
  const baseName = generateFileName(url);
  const fileName = `${baseName}.html`;
  const resourcesDir = `${baseName}_files`;
  const filePath = path.join(outputDir, fileName);
  const resourcesPath = path.join(outputDir, resourcesDir);

  return axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }
  })
    .then(response => {
      const html = response.data;
      return fs.promises.mkdir(resourcesPath, { recursive: true })
        .then(() => html);
    })
    .then(html => {
      const $ = cheerio.load(html);
      const downloadPromises = [];

      $('img').each((_, img) => {
        const imgUrl = new URL($(img).attr('src'), url).href;
        const imgName = generateFileName(imgUrl) + path.extname(imgUrl);
        const imgPath = path.join(resourcesPath, imgName);
        $(img).attr('src', path.join(resourcesDir, imgName));
        
        const downloadImg = axios.get(imgUrl, { responseType: 'arraybuffer' })
          .then(res => fs.promises.writeFile(imgPath, res.data));
        downloadPromises.push(downloadImg);
      });

      return Promise.all(downloadPromises).then(() => fs.promises.writeFile(filePath, $.html()));
    })
    .then(() => console.log(`Page saved: ${filePath}`))
    .catch(err => console.error(`Download error for ${url}:`, err.message));
};

export default downloadPage;
