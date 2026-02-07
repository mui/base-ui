'use client';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { registerCodeHighlighting } from '@lexical/code';

export function CodePlugin() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);

  return null;
}
