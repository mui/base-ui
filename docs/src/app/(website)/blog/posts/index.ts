import 'server-only';
import path from 'node:path';
import { globby } from 'globby';
import type { Metadata } from 'next';
import { authors } from 'docs/src/data/authors';
import type { Author, AuthorId } from 'docs/src/data/authors';
import type * as MDXModule from '*.mdx';

type BlogPostMetadata = {
  authors: AuthorId[];
  publishedAt: Date;
};

type BlogPostModule = typeof MDXModule & {
  metadata: Metadata;
  post?: BlogPostMetadata;
};

export async function getPosts() {
  const files = await globby('*/post.mdx', {
    cwd: path.join(process.cwd(), 'src/app/(website)/blog/posts'),
  });

  const posts = await Promise.all(
    files.map(async (file) => {
      const slug = file.slice(0, -'/post.mdx'.length);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new Error(`Invalid blog slug "${slug}". Use lowercase words separated by hyphens.`);
      }
      const {
        default: Content,
        metadata,
        post,
      }: BlogPostModule = await import(`./${slug}/post.mdx`);

      const publishedAt = post?.publishedAt;
      if (!(publishedAt instanceof Date) || Number.isNaN(publishedAt.getTime())) {
        throw new Error(
          `Invalid publication date for blog post "${slug}". Set post.publishedAt to a valid Date.`,
        );
      }

      const titleSuffix = ' · Base UI';
      const metadataTitle = String(metadata.title ?? '');
      const title = metadataTitle.endsWith(titleSuffix)
        ? metadataTitle.slice(0, -titleSuffix.length)
        : metadataTitle;

      return {
        slug,
        Content,
        metadata,
        title,
        description: metadata.description,
        authors: (post?.authors ?? []).map((id): Author => {
          if (!Object.hasOwn(authors, id)) {
            throw new Error(
              `Unknown author ID "${id}" in blog post "${slug}". Add the author to docs/src/data/authors.ts or correct post.authors.`,
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
