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

  // Define implementation types and their configurations
  const implementationTypes = [
    {
      id: 'css-modules',
      title: 'CSS Modules',
      description: 'This example shows how to implement the component using CSS Modules.',
    },
    {
      id: 'tailwind',
      title: 'Tailwind',
      description: 'This example shows how to implement the component using Tailwind CSS.',
    },
  ];

  // Find which implementation types exist in the demo folder
  const availableImplementations = implementationTypes.filter((type) => {
    const typePath = path.join(demoPath, type.id);
    return fs.existsSync(typePath);
  });

  // Throw error if no implementation types are found
  if (availableImplementations.length === 0) {
    throw new Error(
      `No implementation types found at "${demoPath}". Expected one of: ${implementationTypes.map((t) => t.id).join(', ')}`,
    );
  }

  const result = [];

  // Add main Demo heading
  result.push(mdx.heading(2, 'Demo'));

  /**
   * Process a specific implementation type
   * @param {string} folderPath - Path to the implementation folder
   * @param {string} title - Title for the section heading
   * @param {string} description - Description text for the section
   */
  function processImplementation(folderPath, title, description) {
    result.push(mdx.heading(3, title));
    result.push(mdx.paragraph(description));

    const files = readDirFiles(folderPath);

    files.forEach((file) => {
      const relativePath = path.relative(folderPath, file);
      result.push(createFileCodeBlock(file, relativePath));
    });
  }

  // Process each available implementation type
  availableImplementations.forEach((impl) => {
    const implPath = path.join(demoPath, impl.id);
    processImplementation(implPath, impl.title, impl.description);
  });

  return result;
}
