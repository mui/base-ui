import { existsSync, statSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { basename } from 'node:path';
import { codeToHtml } from 'shiki';
import { DemoVariant } from '../blocks/Demo/types';

const COMPONENTS_BASE_PATH = 'data/base/components';

/**
 * Loads a demo for a component.
 * The demo can be a single file or a directory with multiple variants (such as plain CSS, Tailwind CSS, etc.).
 * The function will look for the demo in the `data/base/components` directory.
 * If the `demoName` is a directory, the loader will look for an `index.tsx` file in each subdirectory.
 *
 * If the entry point is a .ts(x) file, the loader will also look for a .js file with the same name.
 *
 * Note: this function is webpack-specific and will not work in other bundlers.
 *
 * @param componentName Name of the component to load the demo for. Must match the directory name in the `data/base/components` directory.
 * @param demoName Name of the demo to load. Must match the file name (without extension) or directory name in the component demos directory.
 */
export async function loadDemo(componentName: string, demoName: string): Promise<DemoVariant[]> {
  // In this context, a "simple demo" means a demo that consists of a single variant (is a file directly under the component directory),
  // while a "complex demo" means a demo that consists of multiple variants (is a directory with subdirectories for each variant).
  const complexDemoDirectoryPath = `${COMPONENTS_BASE_PATH}/${componentName}/${demoName}`;
  const simpleDemoPath = `${complexDemoDirectoryPath}.tsx`;

  if (existsSync(simpleDemoPath)) {
    // For simple demos, we call the variant "default".
    return loadSimpleDemo(`${componentName}/${demoName}.tsx`, 'default');
  }

  if (existsSync(complexDemoDirectoryPath)) {
    const subdirectories = (await readdir(complexDemoDirectoryPath)).filter((entry) => {
      const fullPath = `${complexDemoDirectoryPath}/${entry}`;
      return statSync(fullPath).isDirectory();
    });

    if (subdirectories.length === 0) {
      throw new Error(`The complex demo ${demoName} for the ${componentName} component is empty.`);
    }

    return Promise.all(
      subdirectories.map(async (variantName) => {
        // Assuming that the entry point for each variant is a TS file.
        const variantPath = `${componentName}/${demoName}/${variantName}/index.tsx`;

        // Complex demos are really a collection of simple demos.
        return loadSimpleDemo(variantPath, variantName);
      }),
    ).then((variants) => variants.flat());
  }

  throw new Error(`Could not find the ${demoName} demo for the ${componentName} component.`);
}

/**
 * Loads a demo that's either a JS file or TS + (translated) JS files, plus their dependencies.
 *
 * @param path Path to the demo entry point, relative to demos root directory (COMPONENTS_BASE_PATH).
 * @param variantName Name of the variant.
 */
async function loadSimpleDemo(path: string, variantName: string): Promise<DemoVariant[]> {
  if (/\.(t|j)sx?$/.test(path) === false) {
    throw new Error(`Invalid demo path: ${path}. The entry point must be a .js(x) or .ts(x) file.`);
  }

  const DemoComponent = (
    await import(
      /* webpackInclude: /\.(tsx?|jsx?)$/ */
      `docs-base/data/base/components/${path}`
    )
  ).default;

  const mainFilePath = `${COMPONENTS_BASE_PATH}/${path}`;
  const mainFileLanguage = /\.tsx?$/.test(mainFilePath) ? 'ts' : 'js';
  const mainContent = await readFile(mainFilePath, 'utf-8');
  const mainPrettyContent = await codeToHtml(mainContent, {
    lang: `${mainFileLanguage}x`,
    theme: 'github-light',
  });

  const languageVariants: DemoVariant[] = [
    {
      name: variantName,
      language: mainFileLanguage,
      component: DemoComponent,
      files: [
        {
          name: basename(mainFilePath),
          content: mainContent,
          prettyContent: mainPrettyContent,
          path: mainFilePath,
          type: mainFileLanguage,
        },
      ],
    },
  ];

  const jsFilePath = mainFilePath.replace(/\.tsx?$/, '.js');
  if (mainFileLanguage === 'ts' && existsSync(jsFilePath)) {
    const jsContent = await readFile(jsFilePath, 'utf-8');
    const jsPrettyPromise = await codeToHtml(jsContent, {
      lang: 'jsx',
      theme: 'github-light',
    });

    languageVariants.push({
      name: variantName,
      language: 'js',
      component: DemoComponent,
      files: [
        {
          name: basename(jsFilePath),
          content: jsContent,
          prettyContent: jsPrettyPromise,
          path: jsFilePath,
          type: 'js',
        },
      ],
    });
  }

  return languageVariants;
}
