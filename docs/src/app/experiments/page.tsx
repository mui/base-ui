import * as React from 'react';
import { readdir } from 'node:fs/promises';
import { type Dirent } from 'node:fs';
import Link from 'next/link';
import classes from './experiments.module.css';

export default async function Experiments() {
  /* @ts-ignore */
  const allExperiments = (
    await readdir('src/app/experiments', { withFileTypes: true })
  )
    .filter(
      (entry: Dirent) =>
        entry.name.endsWith('.tsx') &&
        entry.name !== 'page.tsx' &&
        entry.name !== 'layout.tsx' &&
        entry.isFile(),
    )
    .map((entry: Dirent) => entry.name);

  return (
    <React.Fragment>
      <h1 className={classes.h1}>Base UI Experiments</h1>
      <div className={classes.list}>
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
    </React.Fragment>
  );
}
