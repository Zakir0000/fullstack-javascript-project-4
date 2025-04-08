### Hexlet tests and linter status:
[![Actions Status](https://github.com/Zakir0000/fullstack-javascript-project-4/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/Zakir0000/fullstack-javascript-project-4/actions)

# Page Loader

**Page Loader** is a Node.js command-line utility that downloads a web page and its resources (HTML, images, styles, JavaScript) for offline use.  
It demonstrates asynchronous programming, HTTP handling, DOM parsing, and testing in JavaScript.

## Features

- Downloads the HTML content of a given URL
- Fetches and saves linked assets (images, CSS, JS)
- Saves the full page locally for offline viewing
- Logs progress and errors
- Handles edge cases (broken links, non-existent resources)
- Includes unit tests with mocking and stubbing

## Installation

```bash
git clone https://github.com/your-username/page-loader.git
cd page-loader
npm install
```

You can make it globally accessible:

```bash
npm link
```

## Usage

```bash
page-loader <url> [output-dir]
```

- `<url>` – the web page URL to download
- `[output-dir]` – optional directory to save the page and resources (default: current directory)

### Examples

```bash
page-loader https://example.com
```

```bash
page-loader https://example.com ./downloads
```

## Output

The tool will:
- Create a local HTML file with updated resource paths
- Save assets in a subfolder named `<page-name>_files`

## Options

Run the CLI with `--help` to see available options:

```bash
page-loader --help
```

## Requirements

- Node.js >= 14
- npm

## Development

Run tests:

```bash
npm test
```

Lint code:

```bash
npm run lint
```

## Technologies Used

- Node.js
- Axios
- Cheerio
- Commander
- Jest (or your test framework of choice)
- fs/promises

## License

MIT
