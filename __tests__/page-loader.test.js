import fs from 'fs-extra';
import path from 'path';
import nock from 'nock';
import downloadPage, { generateFileName} from '../utilities/downLoadPage';

describe('page-loader', () => {
  const testUrl = 'http://example.com';
  const testUrlWithPath = 'http://example.com/some/path';
  const testOutputDir = path.join(process.cwd(), 'test-output');
  const mockHtml = '<html><body>Test Content</body></html>';

  beforeEach(() => {
    // Clear all nock interceptors
    nock.cleanAll();
    // Create test output directory
    fs.ensureDirSync(testOutputDir);
  });

  afterEach(() => {
    // Remove test output directory
    fs.removeSync(testOutputDir);
  });

  describe('generateFileName', () => {
    it('should generate correct filename for root URL', () => {
      const fileName = generateFileName(testUrl);
      expect(fileName).toBe('example-com.html');
    });

    it('should generate correct filename for URL with path', () => {
      const fileName = generateFileName(testUrlWithPath);
      expect(fileName).toBe('example-com-some-path.html');
    });

    it('should handle special characters in URL', () => {
      const fileName = generateFileName('http://example.com/foo@bar');
      expect(fileName).toBe('example-com-foo-bar.html');
    });
  });

  describe('downloadPage', () => {
    it('should download page content and save to file', async () => {
      // Mock the HTTP request
      nock('http://example.com')
        .get('/')
        .reply(200, mockHtml);

      const filePath = await downloadPage(testUrl, testOutputDir);
      
      // Verify file was created
      expect(fs.existsSync(filePath)).toBe(true);
      
      // Verify file content
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toBe(mockHtml);
      
      // Verify file path
      expect(filePath).toBe(path.join(testOutputDir, 'example-com.html'));
    });

    it('should handle URL with path correctly', async () => {
      nock('http://example.com')
        .get('/some/path')
        .reply(200, mockHtml);

      const filePath = await downloadPage(testUrlWithPath, testOutputDir);
      expect(filePath).toBe(path.join(testOutputDir, 'example-com-some-path.html'));
    });

    it('should use current directory when output dir is not specified', async () => {
      nock('http://example.com')
        .get('/')
        .reply(200, mockHtml);

      const filePath = await downloadPage(testUrl);
      expect(filePath).toBe(path.join(process.cwd(), 'example-com.html'));
      fs.removeSync(filePath); // Clean up
    });

    it('should reject when HTTP request fails', async () => {
      nock('http://example.com')
        .get('/')
        .reply(404);

      await expect(downloadPage(testUrl, testOutputDir))
        .rejects
        .toThrow();
    });

    it('should reject when file writing fails', async () => {
      nock('http://example.com')
        .get('/')
        .reply(200, mockHtml);

      // Make directory read-only to cause write failure
      fs.chmodSync(testOutputDir, 0o444);

      await expect(downloadPage(testUrl, testOutputDir))
        .rejects
        .toThrow();

      // Restore permissions
      fs.chmodSync(testOutputDir, 0o777);
    });

    it('should include User-Agent header in request', async () => {
      const scope = nock('http://example.com', {
        reqheaders: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })
      .get('/')
      .reply(200, mockHtml);

      await downloadPage(testUrl, testOutputDir);
      expect(scope.isDone()).toBe(true);
    });
  });
});