'use client';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_EDITOR,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';

export function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          const { key, ctrlKey, metaKey } = event;
          const isModifier = ctrlKey || metaKey;

          if (isModifier) {
            const lowerKey = key.toLowerCase();
            if (lowerKey === 'b') {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
              return true;
            }
            if (lowerKey === 'i') {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
              return true;
            }
            if (lowerKey === 'u') {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
              return true;
            }
            if (lowerKey === 'z') {
              event.preventDefault();
              if (event.shiftKey) {
                editor.dispatchCommand(REDO_COMMAND, undefined);
              } else {
                editor.dispatchCommand(UNDO_COMMAND, undefined);
              }
              return true;
            }
            if (lowerKey === 'y') {
              event.preventDefault();
              editor.dispatchCommand(REDO_COMMAND, undefined);
              return true;
            }
            if (lowerKey === 'k') {
              event.preventDefault();
              // Link insertion will be handled in a later task
              return true;
            }
          }
          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor]);

  return null;
}
