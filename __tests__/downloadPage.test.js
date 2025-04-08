import fs from 'fs-extra';
import path from 'path';
import nock from 'nock';
import downloadPage, { generateFileName } from '../utilities/downLoadPage.js';

const tempDir = path.join(process.cwd(), 'temp_test_dir');
const testUrl = 'https://ru.hexlet.io/courses';

const mockHtml = `
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <title>Курсы по программированию Хекслет</title>
  </head>
  <body>
    <img src="/assets/professions/nodejs.png" alt="Иконка профессии Node.js-программист" />
    <h3>
      <a href="/professions/nodejs">Node.js-программист</a>
    </h3>
  </body>
</html>
`;

const mockImage = Buffer.from('mock-image-content');

beforeAll(async () => {
  // Create temporary directory for test files.
  await fs.ensureDir(tempDir);

  // Persist interceptor for HTML request.
  nock('https://ru.hexlet.io')
    .persist()
    .get('/courses')
    .reply(200, mockHtml, { 'Content-Type': 'text/html' });

  // Persist interceptor for image request.
  nock('https://ru.hexlet.io')
    .persist()
    .get('/assets/professions/nodejs.png')
    .reply(200, mockImage, { 'Content-Type': 'image/png' });
});

afterAll(async () => {
  // Clean up temporary directory and nock interceptors.
  await fs.remove(tempDir);
  nock.cleanAll();
});

test('downloads the page and updates image src correctly', async () => {
  // Call downloadPage; note that it doesn't return filePath,
  // so we wait for it to finish.
  await downloadPage(testUrl, tempDir);

  // Expected HTML file path.
  const expectedHtmlFile = path.join(tempDir, `${generateFileName(testUrl)}.html`);

  // Check if the HTML file exists.
  const htmlExists = await fs.pathExists(expectedHtmlFile);
  expect(htmlExists).toBe(true);

  // Read the saved HTML.
  const savedHtml = await fs.readFile(expectedHtmlFile, 'utf-8');

  // Expected updated image src:
  const expectedImgName = `${generateFileName('https://ru.hexlet.io/assets/professions/nodejs.png')}${path.extname('https://ru.hexlet.io/assets/professions/nodejs.png')}`;
  const expectedImgSrc = path.join(`${generateFileName(testUrl)}_files`, expectedImgName);
  expect(savedHtml).toContain(expectedImgSrc);
});

test('downloads image and saves it in the resources folder', async () => {
  await downloadPage(testUrl, tempDir);

  // Expected resource folder.
  const resourcesFolder = path.join(tempDir, `${generateFileName(testUrl)}_files`);

  // Expected image file name (as computed in the module).
  const expectedImgName = `${generateFileName('https://ru.hexlet.io/assets/professions/nodejs.png')}${path.extname('https://ru.hexlet.io/assets/professions/nodejs.png')}`;
  const expectedImgPath = path.join(resourcesFolder, expectedImgName);

  // Check that the image file exists.
  const imageExists = await fs.pathExists(expectedImgPath);
  expect(imageExists).toBe(true);

  // Check that the image content is as expected.
  const savedImage = await fs.readFile(expectedImgPath);
  expect(savedImage).toEqual(mockImage);
});
