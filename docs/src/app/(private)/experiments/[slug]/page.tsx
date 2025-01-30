import * as React from 'react';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type Dirent } from 'node:fs';
import { dirname, basename, extname, resolve } from 'node:path';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Sidebar } from '../infra/Sidebar';
import classes from '../page.module.css';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page(props: Props) {
  const { slug } = await props.params;

  const fullPath = resolve(currentDirectory, `../${slug}.tsx`);

  try {
    const Experiment = (await import(`../${slug}.tsx`)).default;
    return (
      <React.Fragment>
        <Sidebar experimentPath={fullPath} />
        <main className={classes.main}>
          <Experiment />
        </main>
      </React.Fragment>
    );
  } catch (error) {
    notFound();
  }
}

export async function generateStaticParams() {
  return (await readdir('src/app/(private)/experiments', { withFileTypes: true }))
    .filter(
      (entry: Dirent) =>
        entry.name.endsWith('.tsx') &&
        entry.name !== 'page.tsx' &&
        entry.name !== 'layout.tsx' &&
        entry.isFile(),
    )
    .map((entry: Dirent) => ({ slug: basename(entry.name, extname(entry.name)) }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;

  return {
    title: `${slug} - Experiments`,
  };
}
