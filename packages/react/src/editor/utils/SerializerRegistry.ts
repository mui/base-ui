import { LexicalEditor, LexicalNode } from 'lexical';

export type NodeType = 'paragraph' | 'heading' | 'list' | 'listitem' | 'link' | 'blockquote' | 'text';
export type MarkType = 'bold' | 'italic' | 'underline' | 'strike' | 'code';

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
  },
  marks: {
    bold: { open: () => '<strong>', close: () => '</strong>' },
    italic: { open: () => '<em>', close: () => '</em>' },
    underline: { open: () => '<u>', close: () => '</u>' },
    strike: { open: () => '<s>', close: () => '</s>' },
    code: { open: () => '<code>', close: () => '</code>' },
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
