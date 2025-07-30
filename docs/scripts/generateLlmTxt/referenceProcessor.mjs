/**
 * referenceProcessor.mjs - Process component reference definitions
 *
 * This module handles loading and converting component reference data
 * from JSON files into markdown tables for documentation.
 */

import fs from 'fs';
import path from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

import * as mdx from './mdxNodeHelpers.mjs';

/**
 * Parse a markdown string into an AST
 * @param {string} markdown - Markdown string to parse
 * @returns {Object} The root content node of the parsed AST
 */
function parseMarkdown(markdown) {
  // Parse markdown into an AST
  const processor = unified().use(remarkParse);
  const result = processor.parse(markdown);
  return result.children;
}

/**
 * Transforms a Reference component into markdown tables
 * @param {Object} node - The Reference JSX node from MDX
 * @param {Array} ancestors - The ancestry chain of the node
 * @returns {Array} Array of markdown nodes to replace the Reference component
 */
export function processReference(node) {
  // Extract component name and parts from attributes
  const componentAttr = node.attributes?.find((attr) => attr.name === 'component')?.value;
  const partsAttr = node.attributes?.find((attr) => attr.name === 'parts')?.value;

  if (!componentAttr) {
    throw new Error('Missing "component" prop on the "<Reference />" component.');
  }

  const tables = [];

  // Process each component part
  const parts = partsAttr ? partsAttr.split(/,\s*/).map((p) => p.trim()) : [componentAttr];

  // Load component definitions from JSON files
  const componentDefs = [];
  const kebabCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  const projectRoot = path.resolve(import.meta.dirname, '../..');

  for (const part of parts) {
    // Construct file path for this component part
    let filename = `${kebabCase(componentAttr)}-${kebabCase(part)}.json`;
    let filepath = path.join(projectRoot, 'reference/generated', filename);

    // If file doesn't exist, try with just the part name
    if (!fs.existsSync(filepath)) {
      filename = `${kebabCase(part)}.json`;
      filepath = path.join(projectRoot, 'reference/generated', filename);
    }

    // Read and parse JSON file
    if (!fs.existsSync(filepath)) {
      throw new Error(`Reference file not found for component ${componentAttr}, part ${part}`);
    }

    const jsonContent = fs.readFileSync(filepath, 'utf-8');
    const componentDef = JSON.parse(jsonContent);
    componentDefs.push(componentDef);
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
      // Parse the description as markdown
      const descriptionNode = parseMarkdown(def.description);
      tables.push(mdx.paragraph(descriptionNode));
    }

    // Props table
    if (Object.keys(def.props || {}).length > 0) {
      // Create a proper heading with strong node
      tables.push(mdx.paragraph([mdx.strong(`${part} Props:`)]));

      const propsRows = Object.entries(def.props).map(([propName, propDef]) => [
        propName,
        propDef.type ? mdx.inlineCode(propDef.type) : '-',
        propDef.default ? mdx.inlineCode(propDef.default) : '-',
        parseMarkdown(propDef.description || '-'),
      ]);

      // Define column alignments: prop name left-aligned, others left-aligned
      const alignments = ['left', 'left', 'left', 'left'];

      const tableNode = mdx.table(
        ['Prop', 'Type', 'Default', 'Description'],
        propsRows,
        alignments,
      );
      tables.push(tableNode);
    }

    // Data attributes table
    if (Object.keys(def.dataAttributes || {}).length > 0) {
      tables.push(mdx.paragraph([mdx.strong(`${part} Data Attributes:`)]));

      const attrRows = Object.entries(def.dataAttributes).map(([attrName, attrDef]) => [
        attrName,
        attrDef.type ? mdx.inlineCode(attrDef.type) : '-',
        parseMarkdown(attrDef.description || '-'),
      ]);

      // Define column alignments
      const alignments = ['left', 'left', 'left'];

      const tableNode = mdx.table(['Attribute', 'Type', 'Description'], attrRows, alignments);
      tables.push(tableNode);
    }

    // CSS variables table
    if (Object.keys(def.cssVariables || {}).length > 0) {
      tables.push(mdx.paragraph([mdx.strong(`${part} CSS Variables:`)]));

      const cssRows = Object.entries(def.cssVariables).map(([varName, varDef]) => [
        varName,
        varDef.type ? mdx.inlineCode(varDef.type) : '-',
        varDef.default ? mdx.inlineCode(varDef.default) : '-',
        parseMarkdown(varDef.description || '-'),
      ]);

      // Define column alignments
      const alignments = ['left', 'left', 'left', 'left'];

      const tableNode = mdx.table(
        ['Variable', 'Type', 'Default', 'Description'],
        cssRows,
        alignments,
      );
      tables.push(tableNode);
    }

    // Add separator between parts
    if (parts.length > 1 && idx < parts.length - 1) {
      tables.push(mdx.paragraph(''));
    }
  });

  return tables;
}
