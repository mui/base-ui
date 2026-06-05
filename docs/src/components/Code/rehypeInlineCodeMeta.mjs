import { visit } from 'unist-util-visit';

const LOWERCASE_ELEMENT_TAG_PATTERN = /^<\/?([a-z][\w.-]*)(?:\s+[^<>]*)?\s*\/?>$/;

function getTextContent(node) {
  if (node.type === 'text') {
    return node.value || '';
  }

  if (Array.isArray(node.children)) {
    return node.children.map(getTextContent).join('');
  }

  return '';
}

function shouldUsePlainInlineCode(text) {
  const value = text.trim();

  if (!value || value === '<>' || value === '</>') {
    return true;
  }

  return LOWERCASE_ELEMENT_TAG_PATTERN.test(value);
}

export default function rehypeInlineCodeMeta() {
  return (tree) => {
    visit(tree, 'element', (node, _index, parent) => {
      if (
        node.tagName !== 'code' ||
        parent?.tagName === 'pre' ||
        !node.properties ||
        !('dataInline' in node.properties)
      ) {
        return;
      }

      if (shouldUsePlainInlineCode(getTextContent(node))) {
        node.properties.dataPlain = '';
      }
    });
  };
}
