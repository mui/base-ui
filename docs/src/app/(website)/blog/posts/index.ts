import 'server-only';
import path from 'node:path';
import { globby } from 'globby';
import type { ExtractedMetadata } from '@mui/internal-docs-infra/pipeline/transformMarkdownMetadata/types';

import { authors } from 'docs/src/data/authors';
import type { Author, AuthorId } from 'docs/src/data/authors';
import type * as MDXModule from '*.mdx';

type BlogPostMetadata = {
  authors: AuthorId[];
  publishedAt: Date;
};

type BlogPostModule = typeof MDXModule & {
  metadata: ExtractedMetadata;
  post: BlogPostMetadata;
};

export async function getPosts() {
  const files = await globby('*/post.mdx', {
    cwd: path.join(process.cwd(), 'src/app/(website)/blog/posts'),
  });

  const posts = await Promise.all(
    files.map(async (file) => {
      const slug = file.slice(0, -'/post.mdx'.length);

      const {
        default: Content,
        metadata,
        post,
      }: BlogPostModule = await import(`./${slug}/post.mdx`);

      const publishedAt = post?.publishedAt;
      if (!(publishedAt instanceof Date) || Number.isNaN(publishedAt.getTime())) {
        throw new Error(`Blog post "${slug}": set post.publishedAt to a valid Date.`);
      }

      const metadataTitle = metadata.title ?? '';
      const title = metadataTitle.replace(/ · Base UI$/, '');

      return {
        slug,
        Content,
        metadata,
        title,
        description: metadata.description,
        authors: post.authors.map((id): Author => {
          if (!Object.hasOwn(authors, id)) {
            throw new Error(
              `Blog post "${slug}": missing author "${id}" in docs/src/data/authors.ts.`,
            );
          }
          return authors[id];
        }),
        publishedAt,
      };
    }),
  );

  return posts.sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime() || a.slug.localeCompare(b.slug),
  );
}

export async function getPostBySlug(slug: string) {
  return (await getPosts()).find((post) => post.slug === slug);
}
