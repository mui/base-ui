'use client';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_TAB_COMMAND,
  createCommand,
  LexicalCommand,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';

export interface AIAutocompletePluginProps {
  /**
   * A function that returns a completion string based on the current text.
   */
  getCompletion: (text: string) => Promise<string | null>;
  /**
   * Debounce time in ms before calling getCompletion.
   * @default 500
   */
  debounceMs?: number | undefined;
}

export const SET_AI_COMPLETION_COMMAND: LexicalCommand<string | null> = createCommand('SET_AI_COMPLETION_COMMAND');

export function AIAutocompletePlugin(props: AIAutocompletePluginProps) {
  const { getCompletion, debounceMs = 500 } = props;
  const [editor] = useLexicalComposerContext();
  const [completion, setCompletion] = React.useState<string | null>(null);
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const updatePosition = React.useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) && selection.isCollapsed()) {
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const editorElement = editor.getRootElement();
          if (editorElement) {
            const editorRect = editorElement.getBoundingClientRect();
            setPosition({
              top: rect.top - editorRect.top,
              left: rect.left - editorRect.left,
            });
          }
        }
      } else {
        setPosition(null);
      }
    });
  }, [editor]);

  const updateCompletion = React.useCallback(async () => {
    const text = editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return null;
      }
      const anchor = selection.anchor;
      if (anchor.type !== 'text') {
        return null;
      }
      const node = anchor.getNode();
      return node.getTextContent().slice(0, anchor.offset);
    });

    if (text === null || text.trim() === '') {
      setCompletion(null);
      return;
    }

    const result = await getCompletion(text);
    setCompletion(result);
    if (result) {
      updatePosition();
    }
  }, [editor, getCompletion, updatePosition]);

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener((payload) => {
        const { dirtyElements, editorState } = payload;
        const dirtyNodes = (payload as any).dirtyNodes;

        if (dirtyElements.size === 0 && (dirtyNodes?.size ?? 0) === 0) {
          // If no nodes are dirty, we might still want to update position if selection changed
          editorState.read(() => {
             updatePosition();
          });
          return;
        }

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          updateCompletion();
        }, debounceMs);
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updatePosition();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event: KeyboardEvent) => {
          if (completion) {
            event.preventDefault();
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                selection.insertText(completion);
                setCompletion(null);
                setPosition(null);
              }
            });
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        SET_AI_COMPLETION_COMMAND,
        (payload) => {
          setCompletion(payload);
          return true;
        },
        COMMAND_PRIORITY_LOW,
      )
    );
  }, [editor, completion, debounceMs, updateCompletion, updatePosition]);

  // Render ghost text (simplified approach for MVP)
  // In a real production component, we'd use a decorator node or a more sophisticated overlay
  // For now, we'll expose the completion via a custom event or context if needed,
  // but let's try to render it simply.

  return completion && position ? (
    <span
      className="ai-completion-ghost"
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        color: 'var(--color-gray-400)',
        whiteSpace: 'pre',
        zIndex: 1,
        top: position.top,
        left: position.left,
        fontSize: 'inherit',
        lineHeight: 'inherit',
        fontFamily: 'inherit',
        opacity: 0.8,
      }}
    >
      {completion}
    </span>
  ) : null;
}
