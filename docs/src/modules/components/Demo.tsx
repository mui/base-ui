import * as React from 'react';
import { existsSync } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import clsx from 'clsx';
import classes from './Demo.module.css';

export interface DemoProps {
  className?: string;
  demo: string;
  componentName: string;
}

interface DemoSourceProps {
  className?: string;
  file: string;
}

const COMPONENTS_BASE_PATH = 'data/base/components';

async function DemoSource(props: DemoSourceProps) {
  const { file, className } = props;

  const source = await readFile(file, 'utf-8');

  return (
    <div className={clsx(classes.source, className)}>
      <div className={classes.scrollArea}>
        <pre>
          <code>{source}</code>
        </pre>
      </div>
    </div>
  );
}

export async function Demo(props: DemoProps) {
  const { componentName, demo, className } = props;

  const complexDemoDirectoryPath = `${COMPONENTS_BASE_PATH}/${componentName}/${demo}`;
  const simpleDemoPath = `${complexDemoDirectoryPath}.tsx`;

  if (existsSync(complexDemoDirectoryPath)) {
    const stats = await stat(complexDemoDirectoryPath);
    if (stats.isDirectory()) {
      if (existsSync(`${COMPONENTS_BASE_PATH}/${componentName}/${demo}/system/index.tsx`)) {
        const DemoComponent = (
          await import(
            /* webpackInclude: /\.tsx$/ */
            /* webpackMode: "eager" */
            `docs-base/data/base/components/${componentName}/${demo}/system/index.tsx`
          )
        ).default;

        return (
          <React.Fragment>
            <div className={clsx(classes.root, className)}>
              <DemoComponent />
            </div>
            <DemoSource
              file={`${COMPONENTS_BASE_PATH}/${componentName}/${demo}/system/index.tsx`}
            />
          </React.Fragment>
        );
      }

      return (
        <div className={clsx(classes.root, classes.todo, className)}>TODO: render complex demo</div>
      );
    }
  } else if (existsSync(simpleDemoPath)) {
    const DemoComponent = (
      await import(
        /* webpackInclude: /\.tsx$/ */
        /* webpackMode: "eager" */
        `docs-base/data/base/components/${componentName}/${demo}.tsx`
      )
    ).default;

    return (
      <React.Fragment>
        <div className={clsx(classes.root, className)}>
          <DemoComponent />
        </div>
        <DemoSource file={`${COMPONENTS_BASE_PATH}/${componentName}/${demo}.tsx`} />
      </React.Fragment>
    );
  } else {
    return (
      <div className={clsx(classes.root, className)}>
        <p>Unable to render the {demo} demo.</p>
        {
          <p>
            Neither {complexDemoDirectoryPath} directory nor {simpleDemoPath} file exist.
          </p>
        }
      </div>
    );
  }
}
