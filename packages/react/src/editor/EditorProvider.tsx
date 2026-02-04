'use client';
import * as React from 'react';
import { LexicalComposer, InitialConfigType } from '@lexical/react/LexicalComposer';

export interface EditorProviderProps {
  children: React.ReactNode;
  initialConfig?: Partial<InitialConfigType>;
}

const defaultConfig: InitialConfigType = {
  namespace: 'Editor',
  theme: {},
  onError: (error: Error) => {
    console.error(error);
  },
  nodes: [],
};

export function EditorProvider(props: EditorProviderProps) {
  const { children, initialConfig } = props;

  const config: InitialConfigType = React.useMemo(() => ({
    ...defaultConfig,
    ...initialConfig,
  }), [initialConfig]);

  return (
    <LexicalComposer initialConfig={config}>
      {children}
    </LexicalComposer>
  );
}
