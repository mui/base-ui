import { existsSync, statSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { DemoFile, DemoVariant } from 'docs/src/blocks/Demo';
import { highlighter } from 'docs/src/syntax-highlighting';

const COMPONENTS_BASE_PATH = 'data/components';

/**
 * Loads a demo for a component.
 * The demo can be a single file or a directory with multiple variants (such as plain CSS, Tailwind CSS, etc.).
 * The function will look for the demo in the `data/components` directory.
 * If the `demoName` is a directory, the loader will look for an `index.tsx` file in each subdirectory.
 *
 * If the entry point is a .ts(x) file, the loader will also look for a .js file with the same name.
 *
 * Note: this function is webpack-specific and will not work in other bundlers.
 *
 * @param componentName Name of the component to load the demo for. Must match the directory name in the `data/components` directory.
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

const themeFile: DemoFile | null = null;

async function getThemeFile(): Promise<DemoFile> {
  if (themeFile != null) {
    return themeFile;
  }

  const path = 'src/styles/demo-colors.css';
  const content = await readFile(path, 'utf-8');
  const prettyContent = highlighter.codeToHtml(content, {
    lang: 'css',
    theme: 'base-ui',
  });

  return {
    name: 'theme.css',
    content,
    prettyContent,
    path,
    type: 'css',
  };
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
      `docs/data/components/${path}`
    )
  ).default;

  const mainFilePath = `${COMPONENTS_BASE_PATH}/${path}`;
  const mainFileLanguage = /\.tsx?$/.test(mainFilePath) ? 'ts' : 'js';
  const mainContent = await readFile(mainFilePath, 'utf-8');
  const mainPrettyContent = highlighter.codeToHtml(mainContent, {
    lang: `${mainFileLanguage}x`,
    theme: 'base-ui',
  });

  const localImports = getLocalImports(mainContent, dirname(mainFilePath));

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
        ...(await getDependencyFiles(localImports, mainFileLanguage === 'ts')),
      ],
    },
  ];

  const jsFilePath = mainFilePath.replace(/\.tsx?$/, '.js');
  if (mainFileLanguage === 'ts' && existsSync(jsFilePath)) {
    const jsContent = await readFile(jsFilePath, 'utf-8');
    const jsPrettyContent = highlighter.codeToHtml(jsContent, {
      lang: 'jsx',
      theme: 'base-ui',
    });

    const jsLocalImports = getLocalImports(mainContent, dirname(jsFilePath));

    languageVariants.push({
      name: variantName,
      language: 'js',
      component: DemoComponent,
      files: [
        {
          name: basename(jsFilePath),
          content: jsContent,
          prettyContent: jsPrettyContent,
          path: jsFilePath,
          type: 'js',
        },
        ...(await getDependencyFiles(jsLocalImports, false)),
      ],
    });
  }

  return Promise.all(
    languageVariants.map(async (variant) => {
      if (variant.files.some((file) => file.name.endsWith('.module.css'))) {
        variant.files.push(await getThemeFile());
      }

      return variant;
    }),
  );
}

/**
 * Looks for local imports in the file content and resolves them to absolute paths.
 *
 * @param content JS/TS file content.
 * @param baseDirectory Directory the file is located in.
 */
function getLocalImports(content: string, baseDirectory: string): string[] {
  return (
    content.match(/from ['"]\.\.?\/[^'"]+['"]/g)?.map((match) => match.slice(6, -1)) ?? []
  ).map((file) => resolve(baseDirectory, file));
}

/**
 * Lists all the dependencies of the provided files, including transitive dependencies (only in case of JS/TS files).
 *
 * @param paths Paths to the files to read.
 * @param preferTs Whether to prefer TS files over JS files when resolving extensionless imports.
 */
async function getDependencyFiles(paths: string[], preferTs: boolean): Promise<DemoFile[]> {
  const files = await Promise.all(
    paths.map(async (path) => {
      let extension = extname(path);

      if (extension === '') {
        path = resolveExtensionlessFile(path, preferTs);
        extension = extname(path);
      }

      let type: string;
      if (extension === '.ts' || extension === '.tsx') {
        type = 'ts';
      } else if (extension === '.js' || extension === '.jsx') {
        type = 'js';
      } else {
        type = extension.slice(1);
      }

      const content = await readFile(path, 'utf-8');
      const prettyContent = highlighter.codeToHtml(content, {
        lang: extension.slice(1),
        theme: 'base-ui',
      });

      const canHaveDependencies = type === 'ts' || type === 'js';
      const transitiveDependencies = canHaveDependencies
        ? await getDependencyFiles(getLocalImports(content, dirname(path)), type === 'ts')
        : [];

      return [
        {
          name: basename(path),
          content,
          prettyContent,
          path,
          type,
        } satisfies DemoFile,
        ...transitiveDependencies,
      ];
    }),
  );

  return files.flat();
}

/**
 * Given a file path without an extension, resolves it to a file with one of the supported extensions.
 *
 * @param filePath Path to the file without an extension.
 * @param preferTs Whether to prefer TS files over JS files.
 */
function resolveExtensionlessFile(filePath: string, preferTs: boolean): string {
  const extensions = preferTs
    ? ['.tsx', '.ts', '.jsx', '.js', '.json']
    : ['.jsx', '.js', '.tsx', '.ts', '.json'];

  for (const extension of extensions) {
    const fullPath = `${filePath}${extension}`;
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }

  throw new Error(
    `Could not find the file ${filePath} with any of the supported extensions: ${extensions.join(', ')}.`,
  );
}
