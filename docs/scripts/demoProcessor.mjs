/**
 * demoProcessor.mjs - Process demo component directories
 *
 * This module handles loading and converting demo code examples
 * into markdown code blocks for documentation.
 */

import fs from 'fs';
import path from 'path';
import * as mdx from './mdxNodeHelpers.mjs';

/**
 * Read all files from a directory
 * @param {string} directory - The directory to read
 * @returns {Array<string>} Array of file paths
 */
function readDirFiles(directory) {
  try {
    return fs
      .readdirSync(directory)
      .filter((file) => !fs.statSync(path.join(directory, file)).isDirectory())
      .map((file) => path.join(directory, file));
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
    return [];
  }
}

/**
 * Create a code block for a file with a comment header
 * @param {string} filePath - Path to the file
 * @param {string} relativePath - Relative path to show in the comment
 * @returns {Object} Code node with the file content
 */
function createFileCodeBlock(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const extension = path.extname(filePath).slice(1);

  // Add comment header with filename
  const commentedContent = `/* ${relativePath} */\n${content}`;

  // Create code block with appropriate language
  return mdx.code(commentedContent, extension);
}

/**
 * Transforms a Demo component into markdown code blocks
 * @param {Object} node - The Demo JSX node from MDX
 * @param {string} mdxFilePath - Path to the MDX file containing the Demo component
 * @returns {Array} Array of markdown nodes to replace the Demo component
 */
export function processDemo(node, mdxFilePath) {
  // Extract path attribute
  const pathAttr = node.attributes?.find((attr) => attr.name === 'path')?.value;

  if (!pathAttr) {
    throw new Error('Missing "path" prop on the "<Demo />" component.');
  }

  // Resolve demo path relative to the MDX file
  const mdxDir = path.dirname(mdxFilePath);
  const demoPath = path.resolve(mdxDir, pathAttr);

  // Check if the demo folder exists
  if (!fs.existsSync(demoPath)) {
    throw new Error(`Demo folder not found at "${demoPath}"`);
  }

  // Define paths for CSS Modules and Tailwind folders
  const cssModulesPath = path.join(demoPath, 'css-modules');
  const tailwindPath = path.join(demoPath, 'tailwind');

  // Check if at least one of the folders exists
  const hasCssModules = fs.existsSync(cssModulesPath);
  const hasTailwind = fs.existsSync(tailwindPath);

  // Throw error if neither folder exists
  if (!hasCssModules && !hasTailwind) {
    throw new Error(`Neither CSS Modules nor Tailwind folders found at "${demoPath}"`);
  }

  const result = [];

  // Add main Demo heading
  result.push(mdx.heading(2, 'Demo'));

  // Process CSS Modules section if it exists
  if (hasCssModules) {
    result.push(mdx.heading(3, 'CSS Modules'));

    // Add brief explanation paragraph
    result.push(
      mdx.paragraph('This example shows how to implement the component using CSS Modules.'),
    );

    // Get all files in the CSS Modules folder
    const cssModulesFiles = readDirFiles(cssModulesPath);

    // Add code blocks for each file
    cssModulesFiles.forEach((file) => {
      const relativePath = path.relative(cssModulesPath, file);
      result.push(createFileCodeBlock(file, relativePath));
    });
  }

  // Process Tailwind section if it exists
  if (hasTailwind) {
    result.push(mdx.heading(3, 'Tailwind'));

    // Add brief explanation paragraph
    result.push(
      mdx.paragraph('This example shows how to implement the component using Tailwind CSS.'),
    );

    // Get all files in the Tailwind folder
    const tailwindFiles = readDirFiles(tailwindPath);

    // Add code blocks for each file
    tailwindFiles.forEach((file) => {
      const relativePath = path.relative(tailwindPath, file);
      result.push(createFileCodeBlock(file, relativePath));
    });
  }

  return result;
}
