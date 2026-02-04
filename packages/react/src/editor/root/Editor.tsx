'use client'

import * as React from 'react';
import clsx from 'clsx';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { EditorState } from 'lexical';
import { EditorProvider } from '../EditorProvider';
import { EditorContentEditable } from '../content-editable/EditorContentEditable';
import classes from './Editor.module.css';

export interface EditorProps {
  placeholder?: string;
  children?: React.ReactNode;
  value?: any; // SerializedEditorState
  defaultValue?: any; // SerializedEditorState
  onChange?: (value: any) => void;
  className?: string;
  style?: React.CSSProperties;
}

function ControlledInitializer({ value, defaultValue }: { value?: any; defaultValue?: any }) {
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
  },
};

export function Editor(props: EditorProps) {
  const { placeholder, children, value, defaultValue, onChange, className, style } = props;

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
      </div>
    </EditorProvider>
  );
}
