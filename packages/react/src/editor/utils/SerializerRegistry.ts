import { LexicalEditor, LexicalNode } from 'lexical';
import { $isImageNode } from '../nodes/ImageNode';

export type NodeType = 'paragraph' | 'heading' | 'list' | 'listitem' | 'link' | 'blockquote' | 'text' | 'image';
export type MarkType = 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'subscript' | 'superscript' | 'highlight';

export interface NodeSerializeCtx {
  editor: LexicalEditor;
}

export interface NodeSerializer {
  toHTML: (node: LexicalNode, ctx: NodeSerializeCtx) => string | null;
}

export interface MarkSerializer {
  open: (ctx: NodeSerializeCtx) => string;
  close: (ctx: NodeSerializeCtx) => string;
}

export interface SerializerRuleSets {
  nodes: Partial<Record<string, NodeSerializer>>;
  marks: Partial<Record<MarkType, MarkSerializer>>;
}

export interface SerializerRegistry {
  html: SerializerRuleSets;
  extend: (patch: Partial<{ html: Partial<SerializerRuleSets> }>) => SerializerRegistry;
}

const defaultRules: SerializerRuleSets = {
  nodes: {
    text: {
      toHTML: (node) => node.getTextContent(),
    },
    paragraph: {
      toHTML: (node) => `<p>${node.getTextContent()}</p>`, // Simple fallback
    },
    image: {
      toHTML: (node) => {
        if ($isImageNode(node)) {
          return `<img src="${node.getSrc()}" alt="${node.getAltText()}" />`;
        }
        return null;
      },
    },
  },
  marks: {
    bold: { open: () => '<strong>', close: () => '</strong>' },
    italic: { open: () => '<em>', close: () => '</em>' },
    underline: { open: () => '<u>', close: () => '</u>' },
    strike: { open: () => '<s>', close: () => '</s>' },
    code: { open: () => '<code>', close: () => '</code>' },
    subscript: { open: () => '<sub>', close: () => '</sub>' },
    superscript: { open: () => '<sup>', close: () => '</sup>' },
    highlight: { open: () => '<mark>', close: () => '</mark>' },
  },
};

export function createSerializerRegistry(initial?: Partial<SerializerRuleSets> | undefined): SerializerRegistry {
  const rules: SerializerRuleSets = {
    nodes: { ...defaultRules.nodes, ...initial?.nodes },
    marks: { ...defaultRules.marks, ...initial?.marks },
  };

  const registry: SerializerRegistry = {
    html: rules,
    extend: (patch) => {
      if (patch.html?.nodes) {
        rules.nodes = { ...rules.nodes, ...patch.html.nodes };
      }
      if (patch.html?.marks) {
        rules.marks = { ...rules.marks, ...patch.html.marks };
      }
      return registry;
    },
  };

  return registry;
}
