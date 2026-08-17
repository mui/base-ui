import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const harnessDependencies = [
  '@mui/internal-benchmark',
  '@vitest/browser-playwright',
  'react',
  'react-dom',
  'vite',
  'vitest',
];

function version(packageJson: PackageJson, name: string) {
  return packageJson.dependencies?.[name] ?? packageJson.devDependencies?.[name];
}

export function getHarnessDependencyMismatches(base: PackageJson, head: PackageJson) {
  return harnessDependencies.filter((name) => version(base, name) !== version(head, name));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [basePath, headPath] = process.argv.slice(2);
  if (!basePath || !headPath) {
    throw new Error('Usage: node checkHarnessCompatibility.mts <base-package> <head-package>');
  }

  const base = JSON.parse(fs.readFileSync(basePath, 'utf8')) as PackageJson;
  const head = JSON.parse(fs.readFileSync(headPath, 'utf8')) as PackageJson;
  const mismatches = getHarnessDependencyMismatches(base, head);
  if (mismatches.length) {
    throw new Error(
      'The merge base predates the render-count collector and has incompatible harness ' +
        `dependencies (${mismatches.join(', ')}). Update this PR from master.`,
    );
  }
}
