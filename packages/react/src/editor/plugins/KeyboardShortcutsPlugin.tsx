'use client';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_EDITOR,
  FORMAT_TEXT_COMMAND,
  KEY_MODIFIER_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';

export function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (event) => {
          const { code, ctrlKey, metaKey } = event;
          const isModifier = ctrlKey || metaKey;

          if (isModifier) {
            if (code === 'KeyB') {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
              return true;
            }
            if (code === 'KeyI') {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
              return true;
            }
            if (code === 'KeyU') {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
              return true;
            }
            if (code === 'KeyZ') {
              event.preventDefault();
              if (event.shiftKey) {
                editor.dispatchCommand(REDO_COMMAND, undefined);
              } else {
                editor.dispatchCommand(UNDO_COMMAND, undefined);
              }
              return true;
            }
            if (code === 'KeyY') {
              event.preventDefault();
              editor.dispatchCommand(REDO_COMMAND, undefined);
              return true;
            }
            if (code === 'KeyK') {
              event.preventDefault();
              // Link insertion will be handled in a later task
              // For now, we can keep it as a placeholder or just prevent default
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
