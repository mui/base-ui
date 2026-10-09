import * as React from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';

import * as AuthorList from '../components/AuthorList';
import { mdxComponents } from '../components/mdx-components';
import { getPostBySlug, getPosts } from '../posts';

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getPosts()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  return {
    title: post.metadata.title,
    description: post.metadata.description,
    keywords: post.metadata.keywords,
    robots: post.metadata.robots,
    authors: post.authors.map(({ name, url }) => ({ name, url })),
    openGraph: {
      ...(await parent).openGraph,
      type: 'article',
      title: post.title,
      description: post.description ?? undefined,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt.toISOString(),
    },
  };
}

type PageProps = { params: Promise<{ slug: string }> };

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const { Content } = post;

  return (
    <React.Fragment>
      <h1 className="Text sz-4 bp2:sz-5 bui-gcs-1 bui-gce-9 bp1:bui-gce-8 bp2:bui-gce-7 bp4:bui-gce-5">
        {post.title}
      </h1>
      <hr className="bui-gcs-1 bui-gce-5" />
      <div className="bui-gcs-1 bui-gce-9 bp2:bui-gce-3" style={{ color: 'var(--gray-t1)' }}>
        <time dateTime={post.publishedAt.toISOString()} className="bui-d-b">
          {post.publishedAt.toLocaleDateString('en', {
            dateStyle: 'long',
            timeZone: 'UTC',
          })}
        </time>
        <AuthorList.Root aria-label="Authors" className="bui-mt-3">
          {post.authors.map((author) => (
            <AuthorList.Item
              key={author.name}
              name={author.name}
              image={author.image}
              url={author.url}
            />
          ))}
        </AuthorList.Root>
      </div>

      <article className="bui-gcs-1 bui-gce-9 bp3:bui-gcs-3 bp3:bui-gce-8 bp4:bui-gce-7 BlogMdArticle">
        <Content components={mdxComponents} />
      </article>
    </React.Fragment>
  );
}
