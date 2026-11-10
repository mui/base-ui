import path from 'path';
import { expect, it } from 'vitest';
import { createFileContent } from './createFileContent.mjs';

const filePath = path.resolve(import.meta.dirname, '../../public/llms-full.txt');

const structure = {
  sections: [
    {
      title: 'First section',
      pages: [
        { content: '### First page\n\nFirst body.\n' },
        { content: '### Second page\n\n- First item\n- Second item\n' },
      ],
    },
    {
      title: 'Empty section',
      pages: [],
    },
    {
      title: 'Second section',
      pages: [{ content: '### Third page\n\nFinal body.\n' }],
    },
  ],
};

const preamble = ['# Base UI', '', 'Introduction.', ''];
const pageRenderer = (page) => [page.content];

it('matches whole-document formatting when pages are formatted separately', async () => {
  const wholeDocument = await createFileContent({
    structure,
    preamble,
    pageRenderer,
    filePath,
  });
  const separatePages = await createFileContent({
    structure,
    preamble,
    pageRenderer,
    filePath,
    formatPages: true,
  });

  expect(separatePages).toBe(wholeDocument);
  expect(separatePages).toBe(`# Base UI

Introduction.

## First section

### First page

First body.

### Second page

- First item
- Second item

## Second section

### Third page

Final body.
`);
});
