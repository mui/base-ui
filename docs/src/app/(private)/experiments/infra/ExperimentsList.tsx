import * as React from 'react';
import glob from 'fast-glob';
import Link from 'next/link';
import clsx from 'clsx';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { camelToSentenceCase } from 'docs/src/utils/camelToSentenceCase';
import classes from './ExperimentsList.module.css';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const experimentsRootDirectory = resolve(currentDirectory, '..');

const allExperimentFiles = glob.globSync(
  ['**/*.tsx', '!infra/**/*', '!**/page.tsx', '!**/layout.tsx'],
  { cwd: experimentsRootDirectory },
);

const groups: Record<string, { name: string; path: string }[]> = {};

for (const key of allExperimentFiles) {
  const segments = key.split('/');
  let group: string;
  let name: string;

  if (segments.length === 1) {
    group = '*';
    name = segments[0];
  } else {
    group = camelToSentenceCase(segments[0]);
    name =
      segments[1].toLowerCase().startsWith(`${group.toLowerCase()}-`) &&
      segments[1].length > group.length
        ? segments[1].slice(group.length + 1).trim()
        : segments[1].trim();

    console.log(name);
  }

  if (!groups[group]) {
    groups[group] = [];
  }

  groups[group].push({
    name: camelToSentenceCase(name.replace('.tsx', '').replace(/-/g, ' ')),
    path: key.replace('.tsx', ''),
  });
}

export function ExperimentsList(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={clsx(classes.list, props.className)}>
      <h2>All experiments</h2>
      {Object.keys(groups)
        .sort()
        .filter((key) => key !== '*')
        .map((group: string) => {
          return (
            <div key={group}>
              <h3>{group}</h3>
              <ul className={classes.groupItems}>
                {groups[group].map((experiment) => (
                  <li key={experiment.path}>
                    <Link href={`/experiments/${experiment.path}`}>
                      {experiment.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      {groups['*'] && (
        <div>
          <h3>Other</h3>
          <ul className={classes.groupItems}>
            {groups['*'].map((experiment) => (
              <li key={experiment.path}>
                <Link href={`/experiments/${experiment.path}`}>
                  {experiment.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
