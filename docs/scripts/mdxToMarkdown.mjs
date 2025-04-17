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
            // Extract component name and parts from attributes
            const componentAttr = node.attributes?.find((attr) => attr.name === 'component')?.value;
            const partsAttr = node.attributes?.find((attr) => attr.name === 'parts')?.value;

            if (!componentAttr) {
              parent.children.splice(
                index,
                1,
                mdx.paragraph('--- Reference: Missing component attribute ---'),
              );
              return;
            }

            // Create reference table in markdown
            try {
              const tables = [];

              // Add heading for API Reference
              tables.push(mdx.heading(2, 'API Reference'));

              // Process each component part
              const parts = partsAttr
                ? partsAttr.split(/,\s*/).map((p) => p.trim())
                : [componentAttr];
              
              // Load component definitions from JSON files
              const componentDefs = [];
              const kebabCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
              const projectRoot = path.resolve(import.meta.dirname, '..');
              
              for (const part of parts) {
                try {
                  // Construct file path for this component part
                  let filename = `${kebabCase(componentAttr)}-${kebabCase(part)}.json`;
                  let filepath = path.join(projectRoot, 'reference/generated', filename);
                  
                  // If file doesn't exist, try with just the part name
                  if (!fs.existsSync(filepath)) {
                    filename = `${kebabCase(part)}.json`;
                    filepath = path.join(projectRoot, 'reference/generated', filename);
                  }
                  
                  // Read and parse JSON file
                  if (fs.existsSync(filepath)) {
                    const jsonContent = fs.readFileSync(filepath, 'utf-8');
                    const componentDef = JSON.parse(jsonContent);
                    componentDefs.push(componentDef);
                  } else {
                    console.warn(`Reference file not found for ${part}`);
                    componentDefs.push({
                      name: part,
                      description: '',
                      props: {},
                      dataAttributes: {},
                      cssVariables: {}
                    });
                  }
                } catch (err) {
                  console.error(`Error loading reference file for ${part}:`, err);
                  componentDefs.push({
                    name: part,
                    description: '',
                    props: {},
                    dataAttributes: {},
                    cssVariables: {}
                  });
                }
              }
              
              // Generate markdown tables for each component
              componentDefs.forEach((def, idx) => {
                const part = parts[idx];
                
                // Add subheading for the part
                if (parts.length > 1) {
                  tables.push(mdx.heading(3, part));
                }
                
                // Add description if available
                if (def.description) {
                  tables.push(mdx.paragraph(def.description));
                }
                
                // Props table
                if (Object.keys(def.props || {}).length > 0) {
                  tables.push(mdx.paragraph(`**${part} Props**:`));
                  
                  const propsRows = Object.entries(def.props).map(([propName, propDef]) => [
                    propName,
                    propDef.type || '-',
                    propDef.default || '-',
                    propDef.description || '-'
                  ]);
                  
                  const tableContent = mdx.markdownTable(
                    ['Prop', 'Type', 'Default', 'Description'],
                    propsRows
                  );
                  tables.push(mdx.paragraph(tableContent));
                }
                
                // Data attributes table
                if (Object.keys(def.dataAttributes || {}).length > 0) {
                  tables.push(mdx.paragraph(`**${part} Data Attributes**:`));
                  
                  const attrRows = Object.entries(def.dataAttributes).map(([attrName, attrDef]) => [
                    attrName,
                    attrDef.type || '-',
                    attrDef.description || '-'
                  ]);
                  
                  const tableContent = mdx.markdownTable(
                    ['Attribute', 'Type', 'Description'],
                    attrRows
                  );
                  tables.push(mdx.paragraph(tableContent));
                }
                
                // CSS variables table
                if (Object.keys(def.cssVariables || {}).length > 0) {
                  tables.push(mdx.paragraph(`**${part} CSS Variables**:`));
                  
                  const cssRows = Object.entries(def.cssVariables).map(([varName, varDef]) => [
                    varName,
                    varDef.type || '-',
                    varDef.default || '-',
                    varDef.description || '-'
                  ]);
                  
                  const tableContent = mdx.markdownTable(
                    ['Variable', 'Type', 'Default', 'Description'],
                    cssRows
                  );
                  tables.push(mdx.paragraph(tableContent));
                }
                
                // Add separator between parts
                if (parts.length > 1 && idx < parts.length - 1) {
                  tables.push(mdx.paragraph(''));
                }
              });

              // Replace the reference component with our generated tables
              parent.children.splice(index, 1, ...tables);
            } catch (error) {
              console.error(`Error creating reference table for ${componentAttr}:`, error);
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
