/* eslint-disable no-console */
import { globbySync } from 'globby';
import fs from 'fs';

/**
 * Validates if there are no missing exports from TS files that would
 * result in an import from a local file.
 */
function validateMissingExports(fileContent: string) {
  const regex = /import\(["']packages\//gm;
  return !regex.test(fileContent);
}

/**
 * Validates if there component type declarations containing `propTypes: any`.
 * It is a symptom of a missing `React.FC` type annotation.
 */
function validateComponentTypes(fileContent: string) {
  const regex = /propTypes: any/gm;
  return !regex.test(fileContent);
}

function validateFiles() {
  const declarationFiles = globbySync(['packages/*/build/**/*.d.ts'], {
    followSymbolicLinks: false,
  });

  const filesWithMissingExports: string[] = [];
  const filesWithMissingComponentTypes: string[] = [];

  declarationFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    if (!validateComponentTypes(content)) {
      filesWithMissingComponentTypes.push(file);
    }

    if (!validateMissingExports(content)) {
      filesWithMissingExports.push(file);
    }
  });

  console.log(`Checked ${declarationFiles.length} files.`);

  if (filesWithMissingExports.length > 0) {
    console.error('Found invalid imports in the following files:');
    filesWithMissingExports.forEach((file) => console.error(file));
  }

  if (filesWithMissingComponentTypes.length > 0) {
    console.error('Found invalid component types in the following files:');
    filesWithMissingComponentTypes.forEach((file) => console.error(file));
    console.log('Make sure to explicitly annotate components as `React.FC`');
  }

  if (filesWithMissingExports.length > 0 || filesWithMissingComponentTypes.length > 0) {
    process.exit(1);
  }

  console.log('All built declaration files are OK.');
}

validateFiles();
