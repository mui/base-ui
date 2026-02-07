'use client';
import * as React from 'react';
import { LexicalComposer, InitialConfigType } from '@lexical/react/LexicalComposer';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AICompletionNode } from '@base-ui/react';

export interface EditorProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<InitialConfigType> | undefined;
}

const defaultConfig: InitialConfigType = {
  namespace: 'Editor',
  theme: {},
  onError: (error: Error) => {
    console.error(error);
  },
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode, CodeHighlightNode, AICompletionNode],
} ;

export function EditorProvider(props: EditorProviderProps) {
  const { children, initialConfig } = props;

  const config: InitialConfigType = React.useMemo(() => ({
    ...defaultConfig,
    ...initialConfig,
    nodes: [...(defaultConfig.nodes || []), ...(initialConfig?.nodes || [])],
  }), [initialConfig]);

  return (
    <LexicalComposer initialConfig={config}>
      {children}
    </LexicalComposer>
  );
}
