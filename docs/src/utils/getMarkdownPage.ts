import path from 'node:path';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import rehypePrettyCode from 'rehype-pretty-code';
import { evaluate } from '@mdx-js/mdx';
import * as jsxRuntime from 'react/jsx-runtime';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';

if (process.platform === 'win32') {
  process.env.ESBUILD_BINARY_PATH = path.join(
    process.cwd(),
    'node_modules',
    'esbuild',
    'esbuild.exe',
  );
} else {
  process.env.ESBUILD_BINARY_PATH = path.join(
    process.cwd(),
    'node_modules',
    'esbuild',
    'bin',
    'esbuild',
  );
}

export const DATA_PATH = path.join(process.cwd(), 'data/base');

export interface PageMetadata {
  title: string;
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

  // @ts-ignore https://github.com/mdx-js/mdx/issues/2463
  const { default: MDXContent, frontmatter } = await evaluate(mdxSource, {
    ...jsxRuntime,
    remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
    rehypePlugins: [[rehypePrettyCode, { theme: 'github-light' }]],
  });

  return {
    metadata: {
      ...(frontmatter as Partial<PageMetadata>),
      slug,
    } as PageMetadata,
    MDXContent,
  };
};
