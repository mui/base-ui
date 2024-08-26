import LZString from 'lz-string';
import { DemoFile } from 'docs-base/src/blocks/Demo';
import * as CRA from './CreateReactApp';
import { packDemo } from './packDemo';
import { addHiddenInput } from './addHiddenInput';

export interface CreateCodeSandboxOptions {
  title: string;
  naturalLanguage?: string;
  description: string;
  demoFiles: DemoFile[];
  demoLanguage: 'js' | 'ts';
  dependencies: Record<string, string>;
  devDependencies?: Record<string, string>;
  dependencyResolver?: (importPath: string) => Record<string, string>;
  additionalHtmlHeadContent?: string;
  customIndexFile?: string;
}

export function createCodeSandbox(options: CreateCodeSandboxOptions) {
  const payload = createCodeSandboxRequestPayload(options);
  const initialFile = Object.keys(payload)[0];
  const parameters = compress({ files: payload });

  // ref: https://codesandbox.io/docs/learn/sandboxes/cli-api#define-api
  const form = document.createElement('form');
  form.method = 'POST';
  form.target = '_blank';
  form.action = 'https://codesandbox.io/api/v1/sandboxes/define';
  addHiddenInput(form, 'parameters', parameters);
  addHiddenInput(form, 'query', `file=${initialFile}`);
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

function createCodeSandboxRequestPayload(options: CreateCodeSandboxOptions) {
  const {
    title,
    naturalLanguage = 'en',
    customIndexFile,
    demoFiles,
    demoLanguage,
    additionalHtmlHeadContent,
  } = options;

  const packagedDemo = packDemo(demoFiles);
  const indexExtension = demoLanguage === 'ts' ? '.tsx' : '.js';

  const demoFilesToInclude = transformDemoFiles(packagedDemo.processedFiles);

  const files: Record<string, { content: string | object }> = {
    ...demoFilesToInclude,
    [`src/index${indexExtension}`]: {
      content: customIndexFile ?? CRA.getRootIndex(demoLanguage === 'ts'),
    },
    'public/index.html': {
      content: CRA.getHtml({
        title,
        language: naturalLanguage,
        additionalHeadContent: additionalHtmlHeadContent,
      }),
    },
    'package.json': {
      content: createPackageJson(
        options,
        packagedDemo.externalImports,
        `src/index${indexExtension}`,
      ),
    },
  };

  if (demoLanguage === 'ts') {
    files['tsconfig.json'] = {
      content: CRA.getTsconfig(),
    };
  }

  return files;
}

function defaultDependencyResolver(importPath: string) {
  return {
    [importPath]: 'latest',
  };
}

function createPackageJson(
  options: CreateCodeSandboxOptions,
  sourceDependencies: string[],
  mainFile: string,
) {
  const {
    dependencies: hardcodedDependencies,
    description,
    devDependencies,
    dependencyResolver = defaultDependencyResolver,
  } = options;
  const dependencies = new Map<string, string>();

  sourceDependencies.forEach((dependency) => {
    const resolvedDependencies = dependencyResolver(dependency);
    Object.entries(resolvedDependencies).forEach(([name, version]) => {
      dependencies.set(name, version);
    });
  });

  Object.entries(hardcodedDependencies).forEach(([name, version]) => {
    dependencies.set(name, version);
  });

  return {
    description,
    dependencies: Object.fromEntries(dependencies),
    devDependencies,
    scripts: {
      start: 'react-scripts start',
      build: 'react-scripts build',
      test: 'react-scripts test',
      eject: 'react-scripts eject',
    },
    main: mainFile,
  };
}

function transformDemoFiles(files: Record<string, string>) {
  const processedFiles: Record<string, { content: string }> = {};
  Object.keys(files).forEach((file) => {
    processedFiles[`src/${file}`] = { content: files[file] };
  });

  return processedFiles;
}

function compress(object: any) {
  return LZString.compressToBase64(JSON.stringify(object))
    .replace(/\+/g, '-') // Convert '+' to '-'
    .replace(/\//g, '_') // Convert '/' to '_'
    .replace(/=+$/, ''); // Remove ending '='
}
