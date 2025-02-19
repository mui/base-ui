/* eslint-disable no-console */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import glob from 'fast-glob';
import * as jsxRuntime from 'react/jsx-runtime';
import { evaluate } from '@mdx-js/mdx';
import rehypeExtractToc, { type Toc, type TocEntry } from '@stefanprobst/rehype-extract-toc';
import rehypeExportToc from '@stefanprobst/rehype-extract-toc/mdx';
import { rehypeSlug } from 'docs/src/components/QuickNav/rehypeSlug.mjs';
import { rehypeQuickNav } from 'docs/src/components/QuickNav/rehypeQuickNav.mjs';
import { rehypeReference } from 'docs/src/components/ReferenceTable/rehypeReference.mjs';
import remarkGfm from 'remark-gfm';
import { rehypeExtractLinkUrls } from './rehypeExtractLinkUrls.mts';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const docsSpaceRoot = path.resolve(currentDirectory, '../');

const buffer: string[] = [];

const availableAnchors = new Set<string>();
const usedLinks = new Map<string, string[]>();

async function run() {
  const markdownPages = await findMarkdownPages(docsSpaceRoot);

  await Promise.all(
    markdownPages.map(async (markdownPage) => {
      const filePath = path.join(docsSpaceRoot, markdownPage);
      await processMarkdownPage(filePath);
    }),
  );

  const brokenLinks = [...usedLinks.keys()]
    .filter((link) => availableAnchors.has(link) === false)
    .sort();

  if (brokenLinks.length === 0) {
    console.log('No broken links found by `pnpm docs:link-check`\n');
    await save(buffer);
    return;
  }

  write('Broken links found by `pnpm docs:link-check`\n');
  brokenLinks.forEach((linkKey) => {
    write(`- ${linkKey}`);
    console.log(`Broken link: ${linkKey}`);
    console.log(`appearing in:`);
    usedLinks.get(linkKey)!.forEach((f) => console.log(`- ${path.relative(docsSpaceRoot, f)}`));
    console.log('\n');
  });

  await save(buffer);
}

function findMarkdownPages(rootDirectory: string): Promise<string[]> {
  return glob('**/page.{md,mdx}', {
    cwd: rootDirectory,
    ignore: ['**/node_modules/**', '.next/**', 'build/**', 'export/**'],
  });
}

async function processMarkdownPage(filePath: string) {
  const pageUrl = pagePathToUrl(path.relative(docsSpaceRoot, filePath));
  const { anchors, links } = await getLinksAndAnchors(filePath, pageUrl);

  links.forEach((link) => {
    const existing = usedLinks.get(link);
    if (existing != null) {
      existing.push(filePath);
    } else {
      usedLinks.set(link, [filePath]);
    }
  });

  if (pageUrl != null) {
    availableAnchors.add(pageUrl);
    anchors.forEach((hash) => {
      availableAnchors.add(`${pageUrl}#${hash}`);
    });
  }
}

function pagePathToUrl(pagePath: string, trailingSlash = false): string | null {
  const parts = pagePath
    .replace(/^(src\/)?app\//, '')
    .split('/')
    // Filter out route groups
    .filter((part) => !part.startsWith('('))
    .filter((part) => !part.endsWith('.mdx'));

  // Place leading and trailing slash placeholders
  parts.unshift('');
  if (trailingSlash) {
    parts.push('');
  }

  return parts.join('/');
}

async function getLinksAndAnchors(
  filePath: string,
  pageUrl: string | null,
): Promise<{ links: string[]; anchors: string[] }> {
  const mdxSource = await readFile(filePath, 'utf8');

  let rawLinks: Set<string> = new Set();

  const {
    tableOfContents,
    // @ts-ignore https://github.com/mdx-js/mdx/issues/2463
  } = await evaluate(mdxSource, {
    ...jsxRuntime,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeReference,
      rehypeSlug,
      rehypeExtractToc,
      rehypeExportToc,
      rehypeQuickNav,
      [
        rehypeExtractLinkUrls,
        {
          onCompleted: (links: Set<string>) => {
            rawLinks = links;
          },
        },
      ],
    ],
  });

  const links = [...rawLinks]
    .filter((link) => link.startsWith('/') || link.startsWith('#'))
    .map((link) => {
      if (link.startsWith('#')) {
        return `${pageUrl}${link}`;
      }

      return link;
    });

  const anchors = getAnchorsFromTableOfContents(tableOfContents as Toc);

  return {
    anchors,
    links,
  };
}

function getAnchorsFromTableOfContents(tableOfContents: Toc): string[] {
  const anchors: string[] = [];
  tableOfContents.forEach((item: TocEntry) => {
    if (item.id != null) {
      anchors.push(item.id);
    }

    if (item.children != null) {
      anchors.push(...getAnchorsFromTableOfContents(item.children));
    }
  });

  return anchors;
}

function write(text: string) {
  buffer.push(text);
}

async function save(lines: string[]) {
  const fileContents = [...lines, ''].join('\n');
  await writeFile(path.join(docsSpaceRoot, '.link-check-errors.txt'), fileContents);
}

await run();
