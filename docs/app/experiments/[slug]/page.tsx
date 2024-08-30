import { notFound } from 'next/navigation';
import { type Dirent } from 'node:fs';
import { readdir } from 'node:fs/promises';
import * as React from 'react';

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
    const Experiment = (await import(`../${slug}.tsx`)).default;
    return <Experiment />;
  } catch (error) {
    notFound();
  }
}

export async function generateStaticParams() {
  return (await readdir('app/experiments', { withFileTypes: true }))
    .filter(
      (entry: Dirent) =>
        entry.name.endsWith('.tsx') &&
        entry.name !== 'page.tsx' &&
        entry.name !== 'layout.tsx' &&
        entry.isFile(),
    )
    .map((entry: Dirent) => ({ slug: entry.name }));
}
