import type { StorybookConfig } from '@storybook/react-vite';

import remarkGfm from 'remark-gfm';

import ts from 'typescript';

import { dirname } from 'path';

import { fileURLToPath } from 'url';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

// apps/storybook (the directory containing this app's tsconfig.json / package.json).
const storybookRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    {
      // GFM tables are used heavily by the docs template (keyboard/styling contracts).
      name: getAbsolutePath('@storybook/addon-docs'),
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    getAbsolutePath('@storybook/addon-mcp'),
  ],
  framework: getAbsolutePath('@storybook/react-vite'),
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      // Base UI's component source (packages/react/src) is reached from this app only
      // through the `@base-ui/react` path alias below — it is not part of this app's own
      // tsconfig.json `include`. @joshwooding/vite-plugin-react-docgen-typescript resolves
      // its docgen "root files" by intersecting these `include` globs with the active
      // tsconfig's file list, so without this override every Base UI component is silently
      // skipped ("not included in the active TypeScript project"). Passing `compilerOptions`
      // directly bypasses that tsconfig-driven project resolution so the globs below become
      // the docgen program's root files directly.
      include: ['../../packages/react/src/**/*.tsx', 'src/**/*.tsx'],
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        allowJs: true,
        strict: true,
        lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
        // Mirrors this app's own tsconfig.json paths (intentionally kept in sync manually
        // since supplying `compilerOptions` here means tsconfig.json is not read at all).
        baseUrl: storybookRoot,
        paths: {
          '@base-ui/react': ['../../packages/react/src'],
          '@base-ui/react/*': ['../../packages/react/src/*'],
          '@base-ui/utils': ['../../packages/utils/build'],
          '@base-ui/utils/*': ['../../packages/utils/build/*'],
        },
      },
      // keep tables scoped to Base UI's own props — filter out the hundreds of inherited DOM props
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
};
export default config;
