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
  const reactPackageJsonPath = path.join(rootDir, 'packages/react/package.json');
  const reactPackageJsonContent = await fs.readFile(reactPackageJsonPath, 'utf8');
  const reactPackageJson = JSON.parse(reactPackageJsonContent);

  // Get all export paths from @base-ui-components/react package.json
  const reactExports = reactPackageJson.exports;
  const reactEntrypoints = Object.keys(reactExports).map((exportKey) => {
    // Convert from "./accordion" to "@base-ui-components/react/accordion"
    const entrypoint =
      exportKey === '.'
        ? '@base-ui-components/react'
        : `@base-ui-components/react${exportKey.slice(1)}`;
    return entrypoint;
  });

  return {
    entrypoints: [...reactEntrypoints, '@base-ui-components/utils'],
    upload: !!process.env.CI,
  };
});
