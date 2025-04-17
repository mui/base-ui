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

/**
 * Plugin to extract metadata from the MDX content
 */
function extractMetadata() {
  return (tree, file) => {
    // Initialize metadata in file.data
    file.data.metadata = {
      title: '',
      subtitle: '',
      description: ''
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
        const nameAttr = node.attributes?.find(attr => 
          attr.name === 'name' && attr.value === 'description');
        const contentAttr = node.attributes?.find(attr => 
          attr.name === 'content');
          
        if (nameAttr && contentAttr) {
          file.data.metadata.description = contentAttr.value;
        }
      }
    });

    return tree;
  };
}

/**
 * Plugin to remove or simplify MDX-specific syntax
 */
function simplifyMdx() {
  return (tree) => {
    // Handle special components by replacing them with markdown equivalents
    visit(tree, 'mdxJsxFlowElement', (node, index, parent) => {
      if (!parent) return;

      switch (node.name) {
        case 'Demo':
          parent.children.splice(index, 1, {
            type: 'paragraph',
            children: [{ type: 'text', value: '--- Demo ---' }]
          });
          return;
        case 'Reference':
          parent.children.splice(index, 1, {
            type: 'paragraph',
            children: [{ type: 'text', value: '--- Reference ---' }]
          });
          return;
        case 'PropsReferenceTable':
          parent.children.splice(index, 1, {
            type: 'paragraph',
            children: [{ type: 'text', value: '--- PropsReferenceTable ---' }]
          });
          return;
        case 'Subtitle':
          if (node.children?.[0]?.value) {
            parent.children.splice(index, 1, {
              type: 'paragraph',
              children: [{ 
                type: 'emphasis', 
                children: [{ type: 'text', value: node.children[0].value }]
              }]
            });
          }
          return;
      }
    });

    // Remove imports and exports
    visit(tree, ['mdxjsEsm', 'mdxFlowExpression'], (node, index, parent) => {
      if (parent) {
        parent.children.splice(index, 1);
        return [visit.SKIP, index];
      }
    });

    // Remove inline expressions
    visit(tree, 'mdxTextExpression', (node, index, parent) => {
      if (parent) {
        parent.children.splice(index, 1);
        return [visit.SKIP, index];
      }
    });

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
      .use(simplifyMdx)
      .use(remarkStringify, {
        bullet: '-',
        emphasis: '*',
        strong: '*',
        fence: '`',
        fences: true,
        listItemIndent: 'one',
        rule: '-'
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
      description
    };
  } catch (error) {
    console.error('Error converting MDX to Markdown:', error);
    return {
      markdown: `Error converting MDX to Markdown: ${error.message}`,
      title: '',
      subtitle: '',
      description: ''
    };
  }
}