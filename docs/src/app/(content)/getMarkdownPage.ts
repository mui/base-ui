import path from 'node:path';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import rehypePrettyCode from 'rehype-pretty-code';
import { evaluate } from '@mdx-js/mdx';
import * as jsxRuntime from 'react/jsx-runtime';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkGfm from 'remark-gfm';
import extractToc, { type Toc } from '@stefanprobst/rehype-extract-toc';
import exportToc from '@stefanprobst/rehype-extract-toc/mdx';
import { read as readVFile } from 'to-vfile';
import { matter } from 'vfile-matter';
import { highlighter } from 'docs/src/syntax-highlighting';
import { rehypeSlug } from 'docs/src/components/quick-nav/rehypeSlug.mjs';

export const DATA_PATH = path.join(process.cwd(), 'data');

export interface PageMetadata {
  title: string;
  description: string;
  components?: string;
  githubLabel?: string;
  waiAria?: string;
  slug: string;
}

export const getMarkdownPage = async (basePath: string, slug: string) => {
  const mdxFilePath = path.join(DATA_PATH, basePath, `/${slug}/${slug}.mdx`);
  const mdFilePath = path.join(DATA_PATH, basePath, `/${slug}/${slug}.md`);

  let filePath: string;

  if (fs.existsSync(mdxFilePath)) {
    filePath = mdxFilePath;
  } else if (fs.existsSync(mdFilePath)) {
    filePath = mdFilePath;
  } else {
    throw new Error(`No MD(X) file found for ${basePath}/${slug}`);
  }

  const mdxSource = await readFile(filePath, 'utf8');

  const {
    default: MDXContent,
    frontmatter,
    tableOfContents,
    // @ts-ignore https://github.com/mdx-js/mdx/issues/2463
  } = await evaluate(mdxSource, {
    ...jsxRuntime,
    remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          getHighlighter: () => highlighter,
          theme: 'base-ui',
          bypassInlineCode: true,
          grid: false,
        },
      ],
      rehypeSlug,
      extractToc,
      exportToc,
    ],
  });

  return {
    metadata: {
      ...(frontmatter as Partial<PageMetadata>),
      slug,
    } as PageMetadata,
    tableOfContents: tableOfContents as Toc,
    MDXContent,
  };
};

export const getMarkdownPageMetadata = async (basePath: string, slug: string) => {
  const mdxFilePath = path.join(DATA_PATH, basePath, `/${slug}/${slug}.mdx`);
  const mdFilePath = path.join(DATA_PATH, basePath, `/${slug}/${slug}.md`);

  let filePath: string;

  if (fs.existsSync(mdxFilePath)) {
    filePath = mdxFilePath;
  } else if (fs.existsSync(mdFilePath)) {
    filePath = mdFilePath;
  } else {
    throw new Error(`No MD(X) file found for ${basePath}/${slug}`);
  }

  const file = await readVFile(filePath);
  matter(file);

  return file.data.matter as PageMetadata;
};
