import * as React from 'react';
import { readdir } from 'node:fs/promises';
import { type Dirent } from 'node:fs';
import Link from 'next/link';
import clsx from 'clsx';
import classes from './ExperimentsList.module.css';

const allExperiments = (
  await readdir('src/app/(private)/experiments', { withFileTypes: true })
)
  .filter(
    (entry: Dirent) =>
      entry.name.endsWith('.tsx') &&
      entry.name !== 'page.tsx' &&
      entry.name !== 'layout.tsx' &&
      entry.isFile(),
  )
  .map((entry: Dirent) => entry.name);

export function ExperimentsList(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={clsx(classes.list, props.className)}>
      <h2>All experiments</h2>
      {allExperiments
        .filter((key: string) => key !== './page.tsx')
        .map((key: string) => {
          const slug = key.replace('./', '').replace('.tsx', '');
          return (
            <Link key={slug} href={`/experiments/${slug}`}>
              {slug.replace(/-/g, ' ')}
            </Link>
          );
        })}
    </div>
  );
}
