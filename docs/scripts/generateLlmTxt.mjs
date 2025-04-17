#!/usr/bin/env node

/**
 * generateLlmTxt.mjs - Generates llms.txt and markdown files from MDX content
 *
 * This script performs the following:
 * 1. Scans all MDX files in the docs/src/app/(public)/(content)/react folder
 * 2. Converts each MDX file to markdown using a custom React reconciler
 * 3. Outputs the files to docs/llms directory
 * 4. Creates llms.txt according to https://llmstxt.org/ format
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import glob from 'fast-glob';
import { mdxToMarkdown } from './mdxToMarkdown.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const MDX_SOURCE_DIR = path.join(PROJECT_ROOT, 'src/app/(public)/(content)/react');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'llms');

/**
 * Generate llms.txt and markdown files from MDX content
 */
async function generateLlmsTxt() {
  console.log('Generating llms.txt and markdown files...');

  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Find all MDX files
    const mdxFiles = await glob('**/*/page.mdx', {
      cwd: MDX_SOURCE_DIR,
      absolute: true,
    });

    console.log(`Found ${mdxFiles.length} MDX files`);

    // Generate llms.txt entries
    const llmsEntries = [];

    // Process each MDX file
    for (const mdxFile of mdxFiles) {
      // Get relative path for URL generation
      const relativePath = path.relative(MDX_SOURCE_DIR, mdxFile);
      const dirPath = path.dirname(relativePath);

      // Create URL for llms.txt (without /page.mdx)
      const urlPath = dirPath.replace(/\\/g, '/');
      const url = `https://base-ui.org/react/${urlPath}`;

      // Read MDX content
      const mdxContent = await fs.readFile(mdxFile, 'utf-8');

      // Convert to markdown and extract metadata
      const { markdown, title, subtitle, description } = await mdxToMarkdown(mdxContent);

      // Get output file path
      const outputFilePath = path.join(OUTPUT_DIR, `${dirPath.replace(/\\/g, '-')}.md`);

      // Create directories for output if needed
      await fs.mkdir(path.dirname(outputFilePath), { recursive: true });

      // Create markdown content with frontmatter
      const frontmatter = [
        '---',
        `title: ${title || 'Untitled'}`,
        subtitle ? `subtitle: ${subtitle}` : '',
        description ? `description: ${description}` : '',
        '---',
        '',
        markdown,
      ]
        .filter(Boolean)
        .join('\n');

      // Write markdown file
      await fs.writeFile(outputFilePath, frontmatter, 'utf-8');

      // Add entry to llms.txt
      llmsEntries.push(`${url} ${outputFilePath}`);

      console.log(`Processed: ${relativePath}`);
    }

    // Create llms.txt
    const llmsTxtContent = llmsEntries.join('\n');
    await fs.writeFile(path.join(OUTPUT_DIR, 'llms.txt'), llmsTxtContent, 'utf-8');

    console.log(`Successfully generated ${mdxFiles.length} markdown files and llms.txt`);
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    process.exit(1);
  }
}

// Run the generator
generateLlmsTxt();
