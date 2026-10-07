import * as React from 'react';
import type { Metadata } from 'next';
import clsx from 'clsx';
import { Link } from 'docs/src/components/Link';
import { getPosts } from './posts';
import { HeadingLink } from '../../../components/HeadingLink';

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <React.Fragment>
      <h1 className="Text sz-4 bp2:sz-5 bui-gcs-1 bui-gce-9 bp4:bui-gce-5">Notes on interfaces</h1>
      <hr className="bui-gcs-1 bui-gce-5" />
      <ul className="List bui-d-c">
        {posts.map((post, index) => (
          <li key={post.slug} className="bui-d-c">
            <time
              className="Text bui-gcs-1 bui-gce-9 bp2:bui-gce-3"
              dateTime={post.publishedAt.toISOString()}
              style={{ color: 'var(--gray-t1)' }}
            >
              {post.publishedAt.toLocaleDateString('en', {
                dateStyle: 'long',
                timeZone: 'UTC',
              })}
            </time>
            <div
              className={clsx(
                'bui-d-f bui-fd-c bui-gcs-1 bui-g-4 bui-gce-9 bp2:bui-gcs-3 bp4:bui-gce-7',
                index < posts.length - 1 && 'bui-mb-6',
              )}
            >
              <h2 className="Text sz-3">
                <HeadingLink href={`/blog/${post.slug}`}>{post.title}</HeadingLink>
              </h2>
              <p className="Text sz-2">{post.description}</p>
              <Link className="Text sz-2 bui-d-if bui-mt-5" href={`/blog/${post.slug}`} withArrow>
                Read more
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </React.Fragment>
  );
}

export const metadata: Metadata = {
  title: { absolute: 'Blog · Base UI' },
  description: 'Articles about Base UI and building accessible user interfaces.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    title: 'Blog',
    description: 'Articles about Base UI and building accessible user interfaces.',
    url: '/blog',
  },
};
