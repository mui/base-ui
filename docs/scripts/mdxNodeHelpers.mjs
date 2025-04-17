/**
 * mdxNodeHelpers.mjs - Helper functions for creating MDX AST nodes
 * 
 * This module provides utility functions to create nodes for MDX/Markdown
 * abstract syntax trees, making transformer code more readable and maintainable.
 */

/**
 * Create a text node
 * @param {string} value - The text content
 * @returns {Object} A text node
 */
export function text(value) {
  return {
    type: 'text',
    value: value || ''
  };
}

/**
 * Helper to normalize children (handles string, node, or array)
 * @param {string|Object|Array} children - Child content
 * @returns {Array} Normalized array of nodes
 */
function normalizeChildren(children) {
  // Handle empty or undefined
  if (!children) {
    return [];
  }
  
  // Convert to array if not already
  const childArray = Array.isArray(children) ? children : [children];
  
  // Convert strings to text nodes
  return childArray.map(child => 
    typeof child === 'string' ? text(child) : child
  );
}

/**
 * Create a paragraph node
 * @param {string|Object|Array} children - Child node, string, or array of nodes/strings
 * @returns {Object} A paragraph node
 */
export function paragraph(children) {
  return {
    type: 'paragraph',
    children: normalizeChildren(children)
  };
}

/**
 * Create an emphasis (italic) node
 * @param {string|Object|Array} children - Child node, string, or array of nodes/strings
 * @returns {Object} An emphasis node
 */
export function emphasis(children) {
  return {
    type: 'emphasis',
    children: normalizeChildren(children)
  };
}

/**
 * Create a strong (bold) node
 * @param {string|Object|Array} children - Child node, string, or array of nodes/strings
 * @returns {Object} A strong node
 */
export function strong(children) {
  return {
    type: 'strong',
    children: normalizeChildren(children)
  };
}

/**
 * Create a heading node
 * @param {number} depth - Heading level (1-6)
 * @param {string|Object|Array} children - Child node, string, or array of nodes/strings
 * @returns {Object} A heading node
 */
export function heading(depth, children) {
  return {
    type: 'heading',
    depth: depth || 1,
    children: normalizeChildren(children)
  };
}

/**
 * Create a code block node
 * @param {string} value - Code content
 * @param {string} lang - Language for syntax highlighting
 * @returns {Object} A code node
 */
export function code(value, lang) {
  return {
    type: 'code',
    lang: lang || null,
    value: value || ''
  };
}

/**
 * Creates a markdown table as a single string
 * @param {Array<string>} headers - Array of header strings
 * @param {Array<Array<string>>} rows - Array of row data, each row is an array of cell content
 * @param {Array<string>} [alignment] - Optional array of alignments ('left', 'center', 'right') for each column
 * @returns {string} A markdown table string
 */
export function markdownTable(headers, rows, alignment = null) {
  // Create header row
  const headerRow = `| ${headers.join(' | ')} |`;
  
  // Create separator row with alignment
  const separators = headers.map((_, index) => {
    if (!alignment || !alignment[index]) return '-------';
    
    switch(alignment[index]) {
      case 'center': return ':-----:';
      case 'right': return '------:';
      default: return ':------'; // left alignment is default
    }
  });
  
  const separatorRow = `| ${separators.join(' | ')} |`;
  
  // Create data rows
  const dataRows = rows.map(row => `| ${row.join(' | ')} |`);
  
  // Join all rows with newlines
  return [headerRow, separatorRow, ...dataRows].join('\n');
}

// textParagraph has been removed as paragraph() can now handle string inputs directly

/**
 * Function to extract all text from a node and its children recursively
 * @param {Object} node - AST node
 * @returns {string} Extracted text content
 */
export function textContent(node) {
  if (!node) return '';
  
  if (typeof node === 'string') {
    return node;
  }
  
  if (node.type === 'text') {
    return node.value || '';
  }
  
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(textContent).join('');
  }
  
  return '';
}