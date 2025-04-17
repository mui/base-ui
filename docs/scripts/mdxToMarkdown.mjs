/**
 * mdxToMarkdown.mjs - Converts MDX content to Markdown
 *
 * This module transforms MDX content to Markdown format
 * using remark and remark-mdx plugin.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import * as mdx from './mdxNodeHelpers.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processReference } from './referenceProcessor.mjs';

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
        file.data.metadata.title = node.children[0].value;
        return;
      }
    });

    // Extract from MDX components
    visit(tree, 'mdxJsxFlowElement', (node) => {
      // Extract from Subtitle component
      if (node.name === 'Subtitle' && node.children?.[0]?.value) {
        file.data.metadata.subtitle = node.children[0].value;
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
  return (tree) => {
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
        if (!parent) return;
        // Process different component types
        switch (node.name) {
          case 'Demo':
            parent.children.splice(index, 1, mdx.paragraph('--- Demo ---'));
            return;

          case 'Reference': {
            try {
              // Process the reference component using our dedicated processor
              const tables = processReference(node, parent, index);

              // Replace the reference component with the generated tables
              parent.children.splice(index, 1, ...tables);
            } catch (error) {
              console.error(`Error processing Reference component:`, error);
              parent.children.splice(
                index,
                1,
                mdx.paragraph(`--- Reference Error: ${error.message} ---`),
              );
            }
            return;
          }

          case 'PropsReferenceTable':
            parent.children.splice(index, 1, mdx.paragraph('--- PropsReferenceTable ---'));
            return;

          case 'Subtitle': {
            // Extract text from all child nodes
            const subtitleText = mdx.textContent(node);

            // Subtitle is now in frontmatter, so remove from the content
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
 * @returns {Promise<Object>} An object containing the markdown and metadata
 */
export async function mdxToMarkdown(mdxContent) {
  try {
    // Process the MDX content
    const file = await unified()
      .use(remarkParse)
      .use(remarkMdx)
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
      })
      .process(mdxContent);

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
