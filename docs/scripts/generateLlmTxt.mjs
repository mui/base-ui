#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import glob from 'fast-glob';
import { mdxToMarkdown } from './mdxToMarkdown.mjs';
import * as prettier from 'prettier';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const MDX_SOURCE_DIR = path.join(PROJECT_ROOT, 'src/app/(public)/(content)/react');
const OUTPUT_BASE_DIR = path.join(PROJECT_ROOT, 'llms');
const OUTPUT_REACT_DIR = path.join(OUTPUT_BASE_DIR, 'react');

/**
 * Generate llms.txt and markdown files from MDX content
 */
async function generateLlmsTxt() {
  console.log('Generating llms.txt and markdown files...');

  try {
    // Create output directories if they don't exist
    await fs.mkdir(OUTPUT_BASE_DIR, { recursive: true });
    await fs.mkdir(OUTPUT_REACT_DIR, { recursive: true });

    // Store metadata for each section
    const metadataBySection = {
      overview: [],
      handbook: [],
      components: [],
      utils: [],
    };

    // Process files from a specific section
    async function processSection(sectionName) {
      console.log(`Processing ${sectionName} section...`);

      // Find all MDX files in this section
      const sectionPath = path.join(MDX_SOURCE_DIR, sectionName);
      const mdxFiles = await glob('**/*/page.mdx', {
        cwd: sectionPath,
        absolute: true,
      });

      console.log(`Found ${mdxFiles.length} files in ${sectionName}`);

      // Process each MDX file in this section
      for (const mdxFile of mdxFiles) {
        // Get relative path for URL generation
        const relativePath = path.relative(MDX_SOURCE_DIR, mdxFile);
        const dirPath = path.dirname(relativePath);

        // Create URL for llms.txt (without /page.mdx)
        const urlPath = dirPath.replace(/\\/g, '/');

        // Read MDX content
        const mdxContent = await fs.readFile(mdxFile, 'utf-8');

        // Convert to markdown and extract metadata
        const { markdown, title, subtitle, description } = await mdxToMarkdown(mdxContent, mdxFile);

        // Get output file path - maintain the original directory structure under react
        const outputFilePath = path.join(OUTPUT_REACT_DIR, `${dirPath}.md`);

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

        // Store metadata for this file in the appropriate section
        metadataBySection[sectionName].push({
          title: title || 'Untitled',
          subtitle: subtitle || '',
          urlPath: `./react/${urlPath}.md`,
        });

        console.log(`Processed: ${relativePath}`);
      }
    }

    // Process each section
    await processSection('overview');
    await processSection('handbook');
    await processSection('components');
    await processSection('utils');

    // Build structured content for llms.txt
    const sections = ['# Base UI', ''];

    // Create formatted sections in specific order
    const formatSection = (items, title) => {
      if (items.length > 0) {
        sections.push(`## ${title}`, '');

        // Add each item as a link with subtitle, starting with a bullet (-)
        items.forEach((item) => {
          sections.push(`- [${item.title}](${item.urlPath}): ${item.subtitle}`);
        });

        sections.push(''); // Add empty line after section
      }
    };

    // Add sections in the required order
    formatSection(metadataBySection.overview, 'Overview');
    formatSection(metadataBySection.handbook, 'Handbook');
    formatSection(metadataBySection.components, 'Components');
    formatSection(metadataBySection.utils, 'Utilities');

    // Create llms.txt content and format with prettier
    let llmsTxtContent = sections.join('\n');

    // Apply prettier formatting using the project's configuration
    const llmsFilePath = path.join(OUTPUT_BASE_DIR, 'llms.txt');
    const prettierOptions = await prettier.resolveConfig(llmsFilePath);
    
    llmsTxtContent = await prettier.format(llmsTxtContent, {
      ...prettierOptions,
      filepath: llmsFilePath,
      parser: 'markdown',
    });

    await fs.writeFile(path.join(OUTPUT_BASE_DIR, 'llms.txt'), llmsTxtContent, 'utf-8');

    // Calculate the total number of files processed
    const totalFiles =
      metadataBySection.overview.length +
      metadataBySection.handbook.length +
      metadataBySection.components.length +
      metadataBySection.utils.length;

    console.log(`Successfully generated ${totalFiles} markdown files and llms.txt`);
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    process.exit(1);
  }
}

// Run the generator
generateLlmsTxt();
