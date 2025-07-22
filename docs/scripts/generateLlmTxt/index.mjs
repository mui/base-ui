#!/usr/bin/env node
/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

import fs from 'fs/promises';
import path from 'path';
import glob from 'fast-glob';
import * as prettier from 'prettier';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import { mdxToMarkdown } from './mdxToMarkdown.mjs';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../..');
const MDX_SOURCE_DIR = path.join(PROJECT_ROOT, 'src/app/(public)/(content)/react');
const OUTPUT_BASE_DIR = path.join(PROJECT_ROOT, 'public');
const OUTPUT_REACT_DIR = path.join(OUTPUT_BASE_DIR, 'react');

/**
 * Remark plugin to increment heading levels by a specified amount
 * @param {number} increment - Amount to increment each heading level
 */
function incrementHeaders(increment = 1) {
  return (tree) => {
    visit(tree, 'heading', (node) => {
      node.depth = Math.min(node.depth + increment, 6); // Cap at h6
    });
  };
}

/**
 * Function to process markdown and increment headers
 * @param {string} markdown - Markdown string to process
 * @param {number} increment - Amount to increment headers by
 * @returns {Promise<string>} - Processed markdown
 */
async function incrementMarkdownHeaders(markdown, increment) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(incrementHeaders, increment)
    .use(remarkStringify)
    .process(markdown);
  return String(result.value);
}

/**
 * Generate llms.txt and markdown files from MDX content
 */
async function generateLlmsTxt() {
  console.log('Generating llms.txt and markdown files...');

  try {
    // Create output directories if they don't exist
    await fs.mkdir(OUTPUT_BASE_DIR, { recursive: true });
    await fs.mkdir(OUTPUT_REACT_DIR, { recursive: true });

    // Store metadata for each section as objects indexed by ID
    const metadataBySection = {
      overview: {},
      handbook: {},
      components: {},
      utils: {},
    };

    // Counter for total files processed
    let totalFiles = 0;

    // Process files from a specific section
    const processSection = async (sectionName) => {
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

        const frontmatter = [
          '---',
          `title: ${title || 'Untitled'}`,
          subtitle ? `subtitle: ${subtitle}` : null,
          description ? `description: ${description}` : null,
          '---',
        ]
          .filter(Boolean)
          .join('\n');

        // Create markdown content with frontmatter
        let content = [frontmatter, '', markdown].join('\n');

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
        metadataBySection[sectionName][fileId] = {
          id: fileId,
          title: title || 'Untitled',
          subtitle: subtitle || '',
          description: description || '',
          urlPath: `./react/${urlPath}.md`,
          fullMarkdown: markdown,
        };

        // Increment the counter
        totalFiles += 1;

        console.log(`Processed: ${relativePath}`);
      }
    };

    // Process each section
    await processSection('overview');
    await processSection('handbook');
    await processSection('components');
    await processSection('utils');

    // Build shared preamble for both files
    const preamble = [
      '# Base UI',
      '',
      'This is the documentation for the `@base-ui-components/react` package.',
      'It contains a collection of components and utilities for building user interfaces in React.',
      'The library is designed to be composable and styling agnostic.',
      '',
    ];

    // Page rendering functions - focused only on their unique logic
    const renderPageAsLink = (page) => [`- [${page.title}](${page.urlPath}): ${page.description}`];
    const renderPageAsInline = async (page) => {
      // Increment all headers in the markdown by 2 levels (so h1 becomes h3, etc.)
      const content = await incrementMarkdownHeaders(page.fullMarkdown, 2);
      return [content];
    };

    // Define specific orders for sections
    const overviewOrder = ['quick-start', 'accessibility', 'releases', 'about'];
    const handbookOrder = ['styling', 'animation', 'composition'];
    const componentsOrder = Object.keys(metadataBySection.components).sort();
    const utilsOrder = Object.keys(metadataBySection.utils).sort();

    // Helper function to map ordered IDs to their metadata objects
    const mapOrderToMetadata = (orderArray, metadataObject) =>
      orderArray.map((id) => metadataObject[id]);

    // Create the file structure with all sections and pages in correct order
    const structure = {
      sections: [
        {
          title: 'Overview',
          pages: mapOrderToMetadata(overviewOrder, metadataBySection.overview),
        },
        {
          title: 'Handbook',
          pages: mapOrderToMetadata(handbookOrder, metadataBySection.handbook),
        },
        {
          title: 'Components',
          pages: mapOrderToMetadata(componentsOrder, metadataBySection.components),
        },
        {
          title: 'Utilities',
          pages: mapOrderToMetadata(utilsOrder, metadataBySection.utils),
        },
      ],
    };

    const createFile = async (filename, pageRenderer) => {
      // Generate sections with shared logic
      const sections = [];

      for (const section of structure.sections) {
        if (section.pages.length === 0) {
          continue;
        }

        const sectionContent = [`## ${section.title}`, ''];

        // Use the page renderer for each page (handle async renderers)
        for (const page of section.pages) {
          const renderedPage = await pageRenderer(page);
          sectionContent.push(...renderedPage);
        }

        sectionContent.push(''); // Add empty line after section
        sections.push(...sectionContent);
      }

      let content = [...preamble, ...sections].join('\n');

      // Apply prettier formatting
      const filePath = path.join(OUTPUT_BASE_DIR, filename);
      const prettierOptions = await prettier.resolveConfig(filePath);

      content = await prettier.format(content, {
        ...prettierOptions,
        filepath: filePath,
        parser: 'markdown',
      });

      await fs.writeFile(filePath, content, 'utf-8');
    };

    // Generate both files in parallel
    await Promise.all([
      createFile('llms.txt', renderPageAsLink),
      createFile('llms-full.txt', renderPageAsInline),
    ]);

    console.log(`Successfully generated ${totalFiles} markdown files, llms.txt, and llms-full.txt`);
  } catch (error) {
    console.error('Error generating llms.txt:', error);
    process.exit(1);
  }
}

// Run the generator
generateLlmsTxt();
