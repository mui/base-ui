/**
 * mdxToMarkdown.mjs - Converts MDX content to Markdown
 *
 * This module transforms MDX content to Markdown format
 * using remark and remark-mdx plugin.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import * as mdx from './mdxNodeHelpers.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processReference } from './referenceProcessor.mjs';
import { processDemo } from './demoProcessor.mjs';
import * as prettier from 'prettier';

/**
 * Plugin to extract metadata from the MDX content
 */
function extractMetadata() {
  return (tree, file) => {
    // Initialize metadata in file.data
    file.data.metadata = {
      title: '',
      subtitle: '',
      description: '',
    };

    // Extract title from first h1
    visit(tree, 'heading', (node) => {
      if (node.depth === 1 && node.children?.[0]?.value) {
        file.data.metadata.title = mdx.textContent(node);
        return;
      }
    });

    // Extract from MDX components
    visit(tree, ['mdxJsxFlowElement', 'mdxFlowExpression', 'mdxJsxTextElement'], (node) => {
      // Extract from Subtitle component
      if (node.name === 'Subtitle') {
        file.data.metadata.subtitle = mdx.textContent(node);
      }
      // Extract from Meta component
      else if (node.name === 'Meta') {
        const nameAttr = node.attributes?.find(
          (attr) => attr.name === 'name' && attr.value === 'description',
        );
        const contentAttr = node.attributes?.find((attr) => attr.name === 'content');

        if (nameAttr && contentAttr) {
          file.data.metadata.description = contentAttr.value;
        }
      }
    });

    return tree;
  };
}

/**
 * Plugin to transform JSX elements to markdown or remove them from the tree
 */
function transformJsx() {
  return (tree, file) => {
    // Handle JSX flow elements (block-level JSX)
    visit(
      tree,
      [
        'mdxJsxFlowElement',
        'mdxjsEsm',
        'mdxFlowExpression',
        'mdxTextExpression',
        'mdxJsxTextElement',
      ],
      (node, index, parent) => {
        // Process different component types
        switch (node.name) {
          case 'Demo': {
            // Get the file path for context
            const filePath = file.path || '';

            // Process the demo component using our dedicated processor
            const demoContent = processDemo(node, filePath);

            // Replace the demo component with the generated content
            parent.children.splice(index, 1, ...demoContent);
            return;
          }

          case 'Reference': {
            // Process the reference component using our dedicated processor
            const tables = processReference(node, parent, index);

            // Replace the reference component with the generated tables
            parent.children.splice(index, 1, ...tables);

            return;
          }

          case 'PropsReferenceTable':
            parent.children.splice(index, 1, mdx.paragraph('--- PropsReferenceTable ---'));
            return;

          case 'Subtitle': {
            parent.children.splice(index, 1);
            return;
          }

          case 'Meta': {
            // Check if it's a description meta tag
            const nameAttr = node.attributes?.find(
              (attr) => attr.name === 'name' && attr.value === 'description',
            );
            const contentAttr = node.attributes?.find((attr) => attr.name === 'content');

            if (nameAttr && contentAttr && contentAttr.value) {
              // Replace with a paragraph containing the description
              parent.children.splice(index, 1, mdx.paragraph(contentAttr.value));
              return;
            }

            // Remove other Meta tags
            parent.children.splice(index, 1);
            return [visit.SKIP, index];
          }

          default:
            // For other components, remove them to keep only standard markdown elements
            parent.children.splice(index, 1);
            return [visit.SKIP, index];
        }
      },
    );

    return tree;
  };
}

/**
 * Converts MDX content to markdown and extracts metadata
 * @param {string} mdxContent - The MDX content to convert
 * @param {string} mdxFilePath - Optional path to the MDX file for context
 * @returns {Promise<Object>} An object containing the markdown and metadata
 */
export async function mdxToMarkdown(mdxContent, mdxFilePath) {
  try {
    // Process the MDX content and include file path for context
    const vfile = {
      path: mdxFilePath,
      value: mdxContent,
    };

    const file = await unified()
      .use(remarkParse)
      .use(remarkMdx)
      .use(remarkGfm) // Add GitHub Flavored Markdown support
      .use(extractMetadata)
      .use(transformJsx)
      .use(remarkStringify, {
        bullet: '-',
        emphasis: '*',
        strong: '*',
        fence: '`',
        fences: true,
        listItemIndent: 'one',
        rule: '-',
        commonmark: true,
        gfm: true,
      })
      .process(vfile);

    // Get markdown content as string
    const markdown = String(file);

    // Extract metadata from the file's data
    const { title = '', subtitle = '', description = '' } = file.data.metadata || {};

    return {
      markdown,
      title,
      subtitle,
      description,
    };
  } catch (error) {
    console.error('Error converting MDX to Markdown:', error);
    return {
      markdown: `Error converting MDX to Markdown: ${error.message}`,
      title: '',
      subtitle: '',
      description: '',
    };
  }
}
