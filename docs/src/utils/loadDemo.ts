import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { codeToHtml } from 'shiki';
import { DemoVariant } from '../blocks/Demo/types';

const COMPONENTS_BASE_PATH = 'data/base/components';

export async function loadDemo(componentName: string, demoName: string): Promise<DemoVariant[]> {
  const complexDemoDirectoryPath = `${COMPONENTS_BASE_PATH}/${componentName}/${demoName}`;
  const simpleDemoPath = `${complexDemoDirectoryPath}.tsx`;

  if (existsSync(simpleDemoPath)) {
    return loadSimpleDemo(componentName, demoName);
  }

  throw new Error('Not implemented');
}

async function loadSimpleDemo(componentName: string, demoName: string): Promise<DemoVariant[]> {
  const DemoComponent = (
    await import(
      /* webpackInclude: /\.tsx$/ */
      /* webpackMode: "eager" */
      `docs-base/data/base/components/${componentName}/${demoName}.tsx`
    )
  ).default;

  const tsContentPromise = readFile(
    `${COMPONENTS_BASE_PATH}/${componentName}/${demoName}.tsx`,
    'utf-8',
  );
  const jsContentPromise = readFile(
    `${COMPONENTS_BASE_PATH}/${componentName}/${demoName}.js`,
    'utf-8',
  );

  const [tsContent, jsContent] = await Promise.all([tsContentPromise, jsContentPromise]);

  const tsPrettyContentPromise = codeToHtml(tsContent, {
    lang: 'tsx',
    theme: 'github-light',
  });

  const jsPrettyContentPromise = codeToHtml(jsContent, {
    lang: 'jsx',
    theme: 'github-light',
  });

  const [prettyTsContent, prettyJsContent] = await Promise.all([
    tsPrettyContentPromise,
    jsPrettyContentPromise,
  ]);

  return [
    {
      name: 'default',
      language: 'ts',
      component: DemoComponent,
      files: [
        {
          name: `${demoName}.tsx`,
          content: tsContent,
          prettyContent: prettyTsContent,
          path: `${COMPONENTS_BASE_PATH}/${componentName}/${demoName}.tsx`,
          type: 'ts',
        },
      ],
    },
    {
      name: 'default',
      language: 'js',
      component: DemoComponent,
      files: [
        {
          name: `${demoName}.js`,
          content: jsContent,
          prettyContent: prettyJsContent,
          path: `${COMPONENTS_BASE_PATH}/${componentName}/${demoName}.js`,
          type: 'js',
        },
      ],
    },
  ];
}
