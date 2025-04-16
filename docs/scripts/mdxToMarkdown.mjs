/**
 * mdxToMarkdown.mjs - Converts MDX content to Markdown
 *
 * This module provides functions to transform MDX content to Markdown format
 * using a custom React-like reconciler.
 */

import { evaluate } from '@mdx-js/mdx';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';

/**
 * Creates a Markdown renderer that converts React elements to Markdown
 * @returns {Object} A renderer with a render method
 */
function createMarkdownRenderer() {
  // Track the current heading level
  let headingLevel = 0;

  // Track whether we're in a list
  let inList = false;
  let listType = null;
  let listItemNumber = 0;

  // Track table state
  let inTable = false;
  let tableHeader = [];
  let tableRows = [];
  let currentRow = [];

  // Keep track of parent elements
  const elementStack = [];

  const renderChildren = (children) => {
    if (!children) return '';

    if (typeof children === 'string') {
      return children;
    }

    if (Array.isArray(children)) {
      return children.map((child) => renderElement(child)).join('');
    }

    return renderElement(children);
  };

  const renderElement = (element) => {
    if (element == null) return '';

    // Handle primitive values
    if (typeof element === 'string') return element;
    if (typeof element === 'number') return String(element);
    if (typeof element === 'boolean') return '';

    // Skip if not a valid React element
    if (!element.type) return '';

    // Extract props and children
    const { type, props } = element;
    const { children, ...otherProps } = props || {};

    // Track element hierarchy for parent-child relationships
    elementStack.push(element);

    try {
      // Handle different element types
      if (typeof type === 'string') {
        let result;
        switch (type) {
          case 'h1':
            return `# ${renderChildren(children)}\n\n`;
          case 'h2':
            return `## ${renderChildren(children)}\n\n`;
          case 'h3':
            return `### ${renderChildren(children)}\n\n`;
          case 'h4':
            return `#### ${renderChildren(children)}\n\n`;
          case 'h5':
            return `##### ${renderChildren(children)}\n\n`;
          case 'h6':
            return `###### ${renderChildren(children)}\n\n`;
          case 'p':
            return `${renderChildren(children)}\n\n`;
          case 'a':
            return `[${renderChildren(children)}](${otherProps.href || '#'})`;
          case 'strong':
          case 'b':
            return `**${renderChildren(children)}**`;
          case 'em':
          case 'i':
            return `*${renderChildren(children)}*`;
          case 'code': {
            // Check if parent is a 'pre' element to determine if this is a code block
            const parentElement =
              elementStack.length > 1 ? elementStack[elementStack.length - 2] : null;
            const isCodeBlock = parentElement && parentElement.type === 'pre';

            if (isCodeBlock) {
              // This is part of a code block, just return content
              return renderChildren(children);
            } else {
              // This is inline code
              return `\`${renderChildren(children)}\``;
            }
          }
          case 'pre': {
            const codeContent = renderChildren(children);
            return `\`\`\`\n${codeContent}\n\`\`\`\n\n`;
          }
          case 'ul':
            inList = true;
            listType = 'unordered';
            const ulResult = renderChildren(children);
            inList = false;
            listType = null;
            return `${ulResult}\n`;
          case 'ol':
            inList = true;
            listType = 'ordered';
            listItemNumber = 0;
            const olResult = renderChildren(children);
            inList = false;
            listType = null;
            return `${olResult}\n`;
          case 'li':
            if (listType === 'unordered') {
              return `- ${renderChildren(children)}\n`;
            } else if (listType === 'ordered') {
              listItemNumber++;
              return `${listItemNumber}. ${renderChildren(children)}\n`;
            }
            return `- ${renderChildren(children)}\n`;
          case 'table':
            inTable = true;
            tableHeader = [];
            tableRows = [];
            renderChildren(children);
            inTable = false;

            // Build the markdown table
            if (tableHeader.length === 0) return '';

            // Create header and separator
            const headerRow = `| ${tableHeader.join(' | ')} |`;
            const separator = `| ${tableHeader.map(() => '---').join(' | ')} |`;

            // Create data rows
            const dataRows = tableRows
              .map((row) => {
                // Fill missing cells with empty strings
                while (row.length < tableHeader.length) {
                  row.push('');
                }
                return `| ${row.join(' | ')} |`;
              })
              .join('\n');

            result = `${headerRow}\n${separator}\n${dataRows}\n\n`;
            return result;
          case 'thead':
          case 'tbody':
          case 'tfoot':
            return renderChildren(children);
          case 'tr':
            if (inTable) {
              if (tableHeader.length === 0) {
                // This is a header row
                currentRow = [];
                renderChildren(children);
                tableHeader = [...currentRow];
              } else {
                // This is a data row
                currentRow = [];
                renderChildren(children);
                tableRows.push([...currentRow]);
              }
            }
            return '';
          case 'th':
          case 'td':
            if (inTable) {
              currentRow.push(renderChildren(children));
            }
            return '';
          case 'blockquote':
            // Process each line with '>' prefix
            const rawContent = renderChildren(children);
            const quotedContent = rawContent
              .split('\n')
              .map((line) => (line ? `> ${line}` : '>'))
              .join('\n');
            return `${quotedContent}\n\n`;
          case 'hr':
            return `---\n\n`;
          case 'br':
            return `\n`;
          default:
            // For custom or unknown components, just render their children
            return renderChildren(children);
        }
      }

      // Handle React fragments
      if (
        type === React.Fragment ||
        (jsxRuntime && jsxRuntime.Fragment && type === jsxRuntime.Fragment)
      ) {
        return renderChildren(children);
      }

      // Handle function components by calling them with props
      if (typeof type === 'function') {
        const renderedResult = type({ ...otherProps, children });
        return renderElement(renderedResult);
      }

      return '';
    } finally {
      // Always pop the stack, even if an error occurs
      elementStack.pop();
    }
  };

  return {
    render: (element) => {
      return renderElement(element);
    },
  };
}

/**
 * Converts MDX content to markdown
 * @param {string} mdxContent - The MDX content to convert
 * @returns {Promise<string>} The converted markdown
 */
export async function mdxToMarkdown(mdxContent) {
  try {
    // Evaluate MDX to get React component
    const { default: MDXComponent } = await evaluate(mdxContent, {
      ...jsxRuntime,
      development: false,
    });

    // Create simple props for MDX component
    const props = {
      components: {
        Meta: () => '--- Meta ---',
        Demo: () => '--- Demo ---',
        Subtitle: () => '--- Subtitle ---',
        Reference: () => '--- Reference ---',
        PropsReferenceTable: () => '--- PropsReferenceTable ---',
      },
    };

    // Create a markdown renderer
    const markdownRenderer = createMarkdownRenderer();

    // Create a React element from the MDX component
    const element = React.createElement(MDXComponent, props);

    // Render to markdown
    const markdown = markdownRenderer.render(element);

    return markdown;
  } catch (error) {
    console.error('Error converting MDX to Markdown:', error);
    return `Error converting MDX to Markdown: ${error.message}`;
  }
}
