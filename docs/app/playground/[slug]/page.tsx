import * as React from 'react';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type Dirent } from 'node:fs';
import { basename, extname } from 'node:path';
import { readdir } from 'node:fs/promises';

interface Props {
  params: {
    slug: string;
  };
}

export default async function Page(props: Props) {
  const {
    params: { slug },
  } = props;

  try {
    const Playground = (await import(`../${slug}.tsx`)).default;
    return <Playground />;
  } catch (error) {
    notFound();
  }
}

export async function generateStaticParams() {
  return (await readdir('app/playground', { withFileTypes: true }))
    .filter(
      (entry: Dirent) => entry.name.endsWith('.tsx') && entry.name !== 'page.tsx' && entry.isFile(),
    )
    .map((entry: Dirent) => ({ slug: basename(entry.name, extname(entry.name)) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;

  return {
    title: `${slug} - Playground`,
  };
}
