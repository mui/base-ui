#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import glob from 'fast-glob';
import * as prettier from 'prettier';
import { mdxToMarkdown } from './mdxToMarkdown.mjs';

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

      for (const mdxFile of mdxFiles) {
        const relativePath = path.relative(MDX_SOURCE_DIR, mdxFile);
        const dirPath = path.dirname(relativePath);
        const urlPath = dirPath.replace(/\\/g, '/');
        const outputFilePath = path.join(OUTPUT_REACT_DIR, `${dirPath}.md`);

        const mdxContent = await fs.readFile(mdxFile, 'utf-8');

        const { markdown, title, subtitle, description } = await mdxToMarkdown(mdxContent, mdxFile);

        // Create directories for output if needed
        await fs.mkdir(path.dirname(outputFilePath), { recursive: true });

        // Create markdown content with frontmatter
        let content = [
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

        // Format markdown with frontmatter using prettier
        const prettierOptions = await prettier.resolveConfig(outputFilePath);

        content = await prettier.format(content, {
          ...prettierOptions,
          filepath: outputFilePath,
          parser: 'markdown',
        });

        // Write formatted markdown file
        await fs.writeFile(outputFilePath, content, 'utf-8');

        // Extract the filename without extension to use as id
        const fileId = path.basename(dirPath);

        // Store metadata for this file in the appropriate section
        metadataBySection[sectionName].push({
          id: fileId,
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

    sections.push(
      'This is the documentation for the `@base-ui-components/react` package.',
      'It contains a collection of components and utilities for building user interfaces in React.',
      'The library is designed to be composable and styling agnostic.',
      '',
    );

    // Create formatted sections in specific order
    const formatSection = (items, title) => {
      if (items.length > 0) {
        sections.push(`## ${title}`, '');

        // Add each item as a link with description, starting with a bullet (-)
        items.forEach((item) => {
          sections.push(`- [${item.title}](${item.urlPath}): ${item.description}`);
        });

        sections.push(''); // Add empty line after section
      }
    };

    // Define specific orders for sections
    const overviewOrder = ['quick-start', 'accessibility', 'releases', 'about'];
    const handbookOrder = ['styling', 'animation', 'composition'];

    // Validate that all expected overview items exist
    overviewOrder.forEach((id) => {
      if (!metadataBySection.overview.some((item) => item.id === id)) {
        throw new Error(`Missing expected overview item: ${id}`);
      }
    });

    // Validate that all expected handbook items exist
    handbookOrder.forEach((id) => {
      if (!metadataBySection.handbook.some((item) => item.id === id)) {
        throw new Error(`Missing expected handbook item: ${id}`);
      }
    });

    // Sort overview by predefined order
    const sortedOverview = [...metadataBySection.overview].sort((a, b) => {
      return overviewOrder.indexOf(a.id) - overviewOrder.indexOf(b.id);
    });

    // Sort handbook by predefined order
    const sortedHandbook = [...metadataBySection.handbook].sort((a, b) => {
      return handbookOrder.indexOf(a.id) - handbookOrder.indexOf(b.id);
    });

    // Sort components and utilities alphabetically by id
    const sortedComponents = [...metadataBySection.components].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    const sortedUtils = [...metadataBySection.utils].sort((a, b) => a.id.localeCompare(b.id));

    // Add sections in the required order
    formatSection(sortedOverview, 'Overview');
    formatSection(sortedHandbook, 'Handbook');
    formatSection(sortedComponents, 'Components');
    formatSection(sortedUtils, 'Utilities');

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
