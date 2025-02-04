import * as React from 'react';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'fast-glob';
import { Sidebar } from '../infra/Sidebar';
import classes from '../page.module.css';
import { ExperimentRoot } from '../infra/ExperimentRoot';

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
      <ExperimentRoot
        sidebar={<Sidebar experimentPath={fullPath} className={classes.sidebar} />}
      >
        <Experiment />
      </ExperimentRoot>
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

  return files.map((file) => {
    return {
      slug: file.replace(/\.tsx$/, '').split('/'),
    };
  });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { slug } = params;

  return {
    title: `${slug[slug.length - 1]} - Experiments`,
  };
}
