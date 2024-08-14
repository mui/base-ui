import * as React from 'react';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import clsx from 'clsx';
import classes from './Demo.module.css';

export interface DemoProps {
  className?: string;
  demo: string;
  componentName: string;
}

const COMPONENTS_BASE_PATH = 'data/base/components';

export async function Demo(props: DemoProps) {
  const { componentName, demo, className } = props;

  const complexDemoDirectoryPath = `${COMPONENTS_BASE_PATH}/${componentName}/${demo}`;
  const simpleDemoPath = `${complexDemoDirectoryPath}.tsx`;

  if (existsSync(complexDemoDirectoryPath)) {
    const stats = await stat(complexDemoDirectoryPath);
    if (stats.isDirectory()) {
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
      <div className={clsx(classes.root, className)}>
        <DemoComponent />
      </div>
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
