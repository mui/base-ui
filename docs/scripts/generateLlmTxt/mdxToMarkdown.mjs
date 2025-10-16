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
import { processReference } from './referenceProcessor.mjs';
import { processDemo } from './demoProcessor.mjs';
import { processPropsReferenceTable } from './propsReferenceTableProcessor.mjs';
import * as mdx from './mdxNodeHelpers.mjs';
import { resolveMdLinks } from './resolver.mjs';
import { processTypedoc } from './typedocProcessor.mjs';

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
        'heading',
      ],
      (node, index, parent) => {
        if (node.type === 'mdxjsEsm') {
          if (node.data.estree.type === 'Program') {
            const estree = node.data.estree;
            if (estree.body[0].type === 'ImportDeclaration') {
              // Mark subsequent h3+ headings for removal until we hit an h2 or lower
              for (let i = index + 1; i < parent.children.length; i += 1) {
                const nextNode = parent.children[i];
                if (nextNode.type === 'heading') {
                  if (nextNode.depth >= 3) {
                    // Remove h3 headings following the types import
                    nextNode.data = nextNode.data || {};
                    nextNode.data.remove = true;
                  } else {
                    break;
                  }
                }
              }

              // Handle import declarations in MDX
              const importPath = estree.body[0].source.value;
              const demoContent = processTypedoc(node, file.path || '', importPath);

              // Replace the demo component with the generated content
              parent.children.splice(index, 1, ...demoContent);
              return visit.CONTINUE;
            }
          }
        }

        if (node.type === 'heading') {
          if (node.data?.remove) {
            parent.children.splice(index, 1);
            return [visit.SKIP, index];
          }
          return visit.CONTINUE;
        }

        if (node.name.startsWith('Type')) {
          // Remove Type components - they are handled by the import statement
          parent.children.splice(index, 1);
          return [visit.SKIP, index];
        }

        // Process different component types
        switch (node.name) {
          case 'Demo': {
            // Get the file path for context
            const filePath = file.path || '';

            // Process the demo component using our dedicated processor
            const demoContent = processDemo(node, filePath);

            // Replace the demo component with the generated content
            parent.children.splice(index, 1, ...demoContent);
            return visit.CONTINUE;
          }

          case 'Reference': {
            // Process the reference component using our dedicated processor
            const tables = processReference(node, parent, index);

            // Replace the reference component with the generated tables
            parent.children.splice(index, 1, ...tables);

            return visit.CONTINUE;
          }

          case 'PropsReferenceTable': {
            // Process the PropsReferenceTable component using our dedicated processor
            const tables = processPropsReferenceTable(node);

            // Replace the PropsReferenceTable component with the generated tables
            parent.children.splice(index, 1, ...tables);

            return visit.CONTINUE;
          }

          case 'Subtitle': {
            parent.children.splice(index, 1);
            return visit.CONTINUE;
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
              return visit.CONTINUE;
            }

            // Remove other Meta tags
            parent.children.splice(index, 1);
            return [visit.SKIP, index];
          }

          case 'a':
          case 'abbr':
          case 'b':
          case 'br':
          case 'code':
          case 'del':
          case 'em':
          case 'i':
          case 'img':
          case 'kbd':
          case 'mark':
          case 's':
          case 'span':
          case 'strong':
          case 'sub':
          case 'sup':
          case 'time': {
            // Support some HTML elements from GitHub flavored markdown
            return visit.CONTINUE;
          }

          case 'link': {
            // Ignore some hidden elements
            parent.children.splice(index, 1);
            return [visit.SKIP, index];
          }

          default: {
            throw new Error(`Unknown component: ${node.name}`);
          }
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
export async function mdxToMarkdown(mdxContent, mdxFilePath, { urlPath, urlsWithMdVersion } = {}) {
  // Process the MDX content and include file path for context
  const vfile = {
    path: mdxFilePath,
    value: mdxContent,
  };

  const file = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkGfm)
    .use(extractMetadata)
    .use(transformJsx)
    .use(resolveMdLinks, { urlPath, urlsWithMdVersion })
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
}
