import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

export const generateFileName = (url) => {
  const urlObj = new URL(url);
  const host = urlObj.hostname.replace(/\W/g, '-');
  const pathname = urlObj.pathname === '/' ? '' : urlObj.pathname.replace(/\W/g, '-');
  return `${host}${pathname}.html`;
};

const downloadPage = (url, outputDir = process.cwd()) => {
  const fileName = generateFileName(url);
  const filePath = path.join(outputDir, fileName);

  return axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }
  })
    .then(res => fs.outputFile(filePath, res.data))
    .then(() => {
      console.log(filePath);
      return filePath;
    })
    .catch(err => {
      console.error(`Download error ${url}:`, err.message);
      return Promise.reject(err);
    });
};


export default downloadPage;