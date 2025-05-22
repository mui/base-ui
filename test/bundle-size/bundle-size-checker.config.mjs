/**
 * @file Configuration file for bundle-size-checker
 *
 * This file determines which packages and components will have their bundle sizes measured.
 */
import path from 'path';
import fs from 'fs/promises';
import { defineConfig } from '@mui/internal-bundle-size-checker';

const rootDir = path.resolve(import.meta.dirname, '../..');

/**
 * Generates the entrypoints configuration by scanning the exports field in package.json.
 */
export default defineConfig(async () => {
  // Read the package.json to get exports
  const packageJsonPath = path.join(rootDir, 'packages/react/package.json');
  const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  const externals = Object.keys(packageJson.peerDependencies || {});

  // Get all export paths from package.json
  const exports = packageJson.exports;
  const entrypoints = Object.keys(exports).map((exportKey) => {
    // Convert from "./accordion" to "@base-ui-components/react/accordion"
    const entrypoint =
      exportKey === '.'
        ? '@base-ui-components/react'
        : `@base-ui-components/react${exportKey.slice(1)}`;
    return {
      id: entrypoint,
      import: entrypoint,
      externals,
    };
  });

  return {
    entrypoints: [
      ...entrypoints,
      {
        id: 'Base UI checkbox',
        code: `
          import * as React from 'react';
          import { Checkbox } from '@base-ui-components/react/checkbox';

          export default function ExampleCheckbox() {
            return (<>
              <Checkbox.Root />
              <Checkbox.Indicator />
            </>)
          }
        `,
        externals,
      },
      {
        id: 'Radix UI checkbox',
        code: `
          import * as React from "react";
          import { Checkbox } from "radix-ui";

          export default function ExampleCheckbox() {
            return (<>
              <Checkbox.Root />
              <Checkbox.Indicator />
            </>)
          }
        `,
        externals: ['react', 'react-dom'],
      },
    ],
    upload: !!process.env.CI,
  };
});
