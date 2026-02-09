'use client'

import * as React from 'react';
import clsx from 'clsx';
import type { EditorState, SerializedEditorState } from 'lexical';
import type { InitialConfigType } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  HeadingNode,
  QuoteNode,
} from '@lexical/rich-text';
import {
  ListNode,
  ListItemNode,
} from '@lexical/list';
import { LinkNode } from '@lexical/link';
import {
  CodeNode,
  CodeHighlightNode,
} from '@lexical/code';
import { EditorContentEditable } from '../content-editable/EditorContentEditable';
import { KeyboardShortcutsPlugin } from '../plugins/KeyboardShortcutsPlugin';
import { AIAutocompletePlugin, AICompletionNode } from '../plugins/AIAutocompletePlugin';
import { CodePlugin } from '../plugins/CodePlugin';
import { ImageNode } from '../nodes/ImageNode';
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
  /**
   * Enabled formatting options. If not provided, all options are enabled.
   * Options: 'bold', 'italic', 'underline', 'strikethrough', 'code', 'h1', 'h2', 'quote', 'bullet', 'number', 'link', 'undo', 'redo'
   */
  enabledFormats?: string[] | undefined;
  /**
   * Whether the toolbar should be compact.
   */
  compact?: boolean | undefined;
  /**
   * Additional Lexical nodes to register.
   */
  nodes?: InitialConfigType['nodes'] | undefined;
}

const EditorContext = React.createContext<{
  enabledFormats?: string[] | undefined;
  compact?: boolean | undefined;
}>({});

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
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    LinkNode,
    CodeNode,
    CodeHighlightNode,
    AICompletionNode,
    ImageNode,
  ],
  theme: {
    text: {
      bold: classes.textBold,
      italic: classes.textItalic,
      underline: classes.textUnderline,
      strikethrough: classes.textStrikethrough,
      subscript: classes.textSubscript,
      superscript: classes.textSuperscript,
      highlight: classes.textHighlight,
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
    code: classes.code,
    aiCompletion: classes.aiCompletion,
    codeHighlight: {
      atrule: classes.codeAtRule,
      attr: classes.codeAttr,
      boolean: classes.codeBoolean,
      builtin: classes.codeBuiltin,
      cdata: classes.codeCdata,
      char: classes.codeChar,
      class: classes.codeClass,
      'class-name': classes.codeClassName,
      comment: classes.codeComment,
      constant: classes.codeConstant,
      deleted: classes.codeDeleted,
      doctype: classes.codeDoctype,
      entity: classes.codeEntity,
      function: classes.codeFunction,
      important: classes.codeImportant,
      inserted: classes.codeInserted,
      keyword: classes.codeKeyword,
      namespace: classes.codeNamespace,
      number: classes.codeNumber,
      operator: classes.codeOperator,
      prolog: classes.codeProlog,
      property: classes.codeProperty,
      punctuation: classes.codePunctuation,
      regex: classes.codeRegex,
      selector: classes.codeSelector,
      string: classes.codeString,
      symbol: classes.codeSymbol,
      tag: classes.codeTag,
      url: classes.codeUrl,
      variable: classes.codeVariable,
    },
  },
};

export function Editor(props: EditorProps) {
  const {
    placeholder,
    children,
    value,
    defaultValue,
    onChange,
    className,
    style,
    ai,
    floatingToolbar,
    enabledFormats,
    compact,
    nodes,
  } = props;

  const contextValue = React.useMemo(() => ({ enabledFormats, compact }), [enabledFormats, compact]);
  const combinedInitialConfig: InitialConfigType = React.useMemo(() => {
    return {
      ...initialConfig,
      namespace: 'Editor',
      onError: (error: Error) => console.error(error),
      nodes: [...(initialConfig.nodes || []), ...(nodes || [])],
    };
  }, [nodes]);

  return (
    <EditorContext.Provider value={contextValue}>
      <EditorProvider initialConfig={combinedInitialConfig}>
        <div className={clsx(classes.root, className)} style={style}>
          {children}
          <div className={classes.content}>
            <RichTextPlugin
              contentEditable={<EditorContentEditable />}
              placeholder={placeholder ? <div className={classes.placeholder}>{placeholder}</div> : null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            {ai && <AIAutocompletePlugin getCompletion={ai.getCompletion} debounceMs={ai.debounceMs} />}
            {floatingToolbar && <EditorFloatingToolbar />}
            {(value || defaultValue) && <ControlledInitializer value={value} defaultValue={defaultValue} />}
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
          <CodePlugin />
          <KeyboardShortcutsPlugin />
        </div>
      </EditorProvider>
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  return React.useContext(EditorContext);
}
