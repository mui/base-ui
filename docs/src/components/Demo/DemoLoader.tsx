import * as React from 'react';
import { existsSync, statSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { basename, dirname, extname, resolve, join } from 'node:path';
import type { DemoFile, DemoVariant } from 'docs/src/blocks/Demo';
import camelCase from 'lodash/camelCase';
import upperFirst from 'lodash/upperFirst';
import { highlighter } from 'docs/src/syntax-highlighting';
import { Demo } from './Demo';

export interface DemoLoaderProps extends Omit<React.ComponentProps<typeof Demo>, 'variants'> {
  /** Absolute path to a folder with demos or to a .tsx file with the main demo */
  path: string;
  /** Modules that are imported into the current scope in order to render the demo */
  scope: Record<string, any>;
}

export async function DemoLoader({ path, scope, ...props }: DemoLoaderProps) {
  const variants = await loadDemo({ path, scope });

  if (!variants.length) {
    throw new Error(`\nCould not load demo: no demos found in "${path}".`);
  }

  return <Demo variants={variants} {...props} />;
}

async function loadDemo({ path, scope }: DemoLoaderProps): Promise<DemoVariant[]> {
  if (existsSync(path)) {
    // Is the entry point a single file?
    if (statSync(path).isFile()) {
      // For simple demos, we call the variant "default".
      return getDemoFromFile(path, 'default', scope.default);
    }

    const subdirectories = (await readdir(path)).filter((entry) => {
      const fullPath = join(path, entry);
      return statSync(fullPath).isDirectory();
    });

    if (subdirectories.length === 0) {
      throw new Error(`Could not load demo: "${path}" does not contain subdirectories.`);
    }

    return Promise.all(
      subdirectories.map(async (dir) => {
        // Assuming that the entry point for each variant is an index.tsx file.
        const variantPath = `${path}/${dir}/index.tsx`;
        const DemoComponent = upperFirst(camelCase(dir));
        return getDemoFromFile(variantPath, dir, scope[DemoComponent]);
      }),
    ).then((variants) => variants.flat());
  }

  throw new Error(`Could not load demo: "${path}" does not exist.`);
}

const themeFile: DemoFile | null = null;

async function getThemeFile(): Promise<DemoFile> {
  if (themeFile != null) {
    return themeFile;
  }

  const path = 'src/demo-theme.css';
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
 * @param path Absolute path to the demo entry point.
 * @param variantName Name of the variant.
 */
async function getDemoFromFile(
  path: string,
  variantName: string,
  DemoComponent: any,
): Promise<DemoVariant[]> {
  if (/\.(t|j)sx?$/.test(path) === false) {
    throw new Error(
      `Could not load demo: "${path}" entry point must be a .js, .ts, .jsx, or .tsx file.`,
    );
  }

  const mainFileLanguage = /\.tsx?$/.test(path) ? 'ts' : 'js';
  const mainContent = await readFile(path, 'utf-8');
  const mainPrettyContent = highlighter.codeToHtml(mainContent, {
    lang: `${mainFileLanguage}x`,
    theme: 'base-ui',
  });

  const localImports = getLocalImports(mainContent, dirname(path));

  const languageVariants: DemoVariant[] = [
    {
      name: variantName,
      language: mainFileLanguage,
      component: DemoComponent,
      files: [
        {
          name: basename(path),
          content: mainContent,
          prettyContent: mainPrettyContent,
          path,
          type: mainFileLanguage,
        },
        ...(await getDependencyFiles(localImports, mainFileLanguage === 'ts')),
      ],
    },
  ];

  const jsFilePath = path.replace(/\.tsx?$/, '.js');
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
  const localPaths = [
    // import { foo } from './foo'
    ...(content.match(/from ['"]\.\.?\/[^'"]+['"]/g)?.map((match) => match.slice(6, -1)) ?? []),
    // import './foo'
    ...(content.match(/import ['"]\.\.?\/[^'"]+['"]/g)?.map((match) => match.slice(8, -1)) ?? []),
  ];

  return localPaths.map((file) => resolve(baseDirectory, file));
}

const shikiLanguageMapping = {
  jsx: 'js',
  ts: 'tsx',
} as Record<string, string>;

/**
 * Lists all the dependencies of the provided files, including transitive dependencies (only in case of JS/TS files).
 *
 * @param paths Paths to the files to read.
 * @param preferTs Whether to prefer TS files over JS files when resolving extensionless imports.
 */
export async function getDependencyFiles(paths: string[], preferTs: boolean): Promise<DemoFile[]> {
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
        lang: shikiLanguageMapping[extension.slice(1)] ?? extension.slice(1),
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
