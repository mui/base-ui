/**
 * @file Configuration file for bundle-size-checker
 *
 * This file determines which packages and components will have their bundle sizes measured.
 */
import path from 'path';
import fs from 'fs/promises';
import { defineConfig } from '@mui/internal-bundle-size-checker';

const rootDir = path.resolve(import.meta.dirname, '..');

/**
 * Generates the entrypoints configuration by scanning the exports field in package.json.
 */
export default defineConfig(async () => {
  // Read the package.json to get exports
  const packageJsonPath = path.join(rootDir, 'packages/react/package.json');
  const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  
  // Get all export paths from package.json
  const exports = packageJson.exports;
  const entrypoints = Object.keys(exports).map(exportKey => {
    // Convert from "./accordion" to "@base-ui-components/react/accordion"
    const entrypoint = exportKey === '.' 
      ? '@base-ui-components/react' 
      : `@base-ui-components/react${exportKey.slice(1)}`;
    return entrypoint;
  });

  const isPullRequest = !!process.env.CIRCLE_PULL_REQUEST;

  // Return the complete entrypoints configuration
  return {
    entrypoints,
    // Only add upload config when in CI environment
    ...(process.env.CI && {
      upload: {
        project: 'mui/base-ui',
        branch: process.env.CIRCLE_BRANCH,
        isPullRequest,
      },
    }),
  };
});