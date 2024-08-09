import path from 'node:path';
import fs from 'node:fs';
import { bundleMDX } from 'mdx-bundler';

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

export const getMdxPage = async (basePath: string, slug: string) => {
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

  const { frontmatter, code } = await bundleMDX({
    file: filePath,
    cwd: process.cwd(),
  });

  return {
    metadata: {
      ...frontmatter,
      slug,
    } as PageMetadata,
    code,
  };
};
