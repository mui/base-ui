'use client'

import * as React from 'react';
import clsx from 'clsx';
import type { EditorState, SerializedEditorState } from 'lexical';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { EditorContentEditable } from '../content-editable/EditorContentEditable';
import { KeyboardShortcutsPlugin } from '../plugins/KeyboardShortcutsPlugin';
import { AIAutocompletePlugin } from '../plugins/AIAutocompletePlugin';
import { EditorFloatingToolbar } from '../floating-toolbar/EditorFloatingToolbar';
import { EditorProvider } from '../EditorProvider';
import classes from './Editor.module.css';

export interface EditorProps {
  placeholder?: string | undefined;
  children?: React.ReactNode | undefined;
  value?: SerializedEditorState | undefined;
  defaultValue?: SerializedEditorState | undefined;
  onChange?: ((value: SerializedEditorState) => void) | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
  /**
   * AI completion configuration.
   */
  ai?: {
    getCompletion: (text: string) => Promise<string | null>;
    debounceMs?: number | undefined;
  } | undefined;
  /**
   * Whether to enable the floating toolbar.
   */
  floatingToolbar?: boolean | undefined;
}

function ControlledInitializer({
  value,
  defaultValue,
}: {
  value?: SerializedEditorState | undefined;
  defaultValue?: SerializedEditorState | undefined;
}) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (defaultValue) {
      const state = editor.parseEditorState(defaultValue);
      editor.setEditorState(state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (value) {
      const currentState = editor.getEditorState();
      const currentJSON = JSON.stringify(currentState.toJSON());
      const nextJSON = JSON.stringify(value);

      if (currentJSON !== nextJSON) {
        const state = editor.parseEditorState(value);
        editor.setEditorState(state);
      }
    }
  }, [editor, value]);

  return null;
}

const initialConfig = {
  theme: {
    text: {
      bold: classes.textBold,
      italic: classes.textItalic,
      underline: classes.textUnderline,
      strikethrough: classes.textStrikethrough,
    },
    heading: {
      h1: classes.h1,
      h2: classes.h2,
    },
    quote: classes.quote,
    list: {
      ul: classes.ul,
      ol: classes.ol,
      listitem: classes.listitem,
    },
    link: classes.link,
  },
};

export function Editor(props: EditorProps) {
  const { placeholder, children, value, defaultValue, onChange, className, style, ai, floatingToolbar } = props;

  return (
    <EditorProvider initialConfig={initialConfig}>
      <div className={clsx(classes.root, className)} style={style}>
        {children}
        <div className={classes.content}>
          <RichTextPlugin
            contentEditable={<EditorContentEditable />}
            placeholder={placeholder ? <div className={classes.placeholder}>{placeholder}</div> : null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          {ai && (
            <AIAutocompletePlugin
              getCompletion={ai.getCompletion}
              debounceMs={ai.debounceMs}
            />
          )}
          {floatingToolbar && <EditorFloatingToolbar />}
          {(value || defaultValue) && (
            <ControlledInitializer value={value} defaultValue={defaultValue} />
          )}
          {onChange && (
            <OnChangePlugin
              onChange={(state: EditorState) => {
                const json = state.toJSON();
                onChange(json);
              }}
            />
          )}
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <KeyboardShortcutsPlugin />
      </div>
    </EditorProvider>
  );
}
