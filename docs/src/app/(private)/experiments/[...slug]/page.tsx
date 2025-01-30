import * as React from 'react';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dirname, basename, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'fast-glob';
import { Sidebar } from '../infra/Sidebar';
import classes from '../page.module.css';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const experimentsRootDirectory = resolve(currentDirectory, '..');

interface Props {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function Page(props: Props) {
  const { slug } = await props.params;

  const fullPath = resolve(currentDirectory, `../${slug.join('/')}.tsx`);

  try {
    const Experiment = (await import(`../${slug.join('/')}.tsx`)).default;
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
  const files = glob.globSync(
    ['**/*.tsx', '!infra/**/*', '!**/page.tsx', '!**/layout.tsx'],
    { cwd: experimentsRootDirectory },
  );

  return files.map((file) => ({
    slug: [basename(file, extname(file))],
  }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;

  return {
    title: `${slug} - Experiments`,
  };
}
