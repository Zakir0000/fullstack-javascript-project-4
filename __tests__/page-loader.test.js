import fs from 'fs/promises';
import path from 'path';
import nock from 'nock';
import { temporaryDirectory } from 'tempy';
import downloadPage from '../utilities/downLoadPage';

describe('PageLoader', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = temporaryDirectory();
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test('downloads page and resources', async () => {
    const url = 'http://example.com';
    const htmlContent = `
      <html>
        <img src="/image.png" />
        <link rel="stylesheet" href="/style.css" />
        <script src="/script.js"></script>
      </html>
    `;

    nock(url)
      .get('/')
      .reply(200, htmlContent)
      .get('/image.png')
      .reply(200, 'image-data')
      .get('/style.css')
      .reply(200, 'css-data')
      .get('/script.js')
      .reply(200, 'js-data');

    await downloadPage(url, tempDir);

    const html = await fs.readFile(path.join(tempDir, 'example-com.html'), 'utf-8');
    expect(html).toContain('example-com_files/example-com-image.png');
    expect(html).toContain('example-com_files/example-com-style.css');
    expect(html).toContain('example-com_files/example-com-script.js');

    await expect(fs.access(path.join(tempDir, 'example-com_files/example-com-image.png'))).resolves.not.toThrow();
    await expect(fs.access(path.join(tempDir, 'example-com_files/example-com-style.css'))).resolves.not.toThrow();
    await expect(fs.access(path.join(tempDir, 'example-com_files/example-com-script.js'))).resolves.not.toThrow();
  });

  test('handles download errors', async () => {
    const url = 'http://example.com';
    nock(url)
      .get('/')
      .reply(404);

    await expect(downloadPage(url, tempDir)).rejects.toThrow('Request failed with status code 404');
  });
});