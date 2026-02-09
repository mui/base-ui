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
import { useEditorContext } from '../root/Editor';

export function KeyboardShortcutsPlugin() {
  const [editor] = useLexicalComposerContext();
  const { enabledFormats } = useEditorContext();

  const isEnabled = React.useCallback(
    (format: string) => {
      if (!enabledFormats) {
        return true;
      }
      return enabledFormats.includes(format);
    },
    [enabledFormats],
  );

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          const { key, ctrlKey, metaKey } = event;
          const isModifier = ctrlKey || metaKey;

          if (isModifier) {
            const lowerKey = key.toLowerCase();
            if (lowerKey === 'b' && isEnabled('bold')) {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
              return true;
            }
            if (lowerKey === 'i' && isEnabled('italic')) {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
              return true;
            }
            if (lowerKey === 'u' && isEnabled('underline')) {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
              return true;
            }
            if (lowerKey === ',' && isEnabled('subscript')) {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
              return true;
            }
            if (lowerKey === '.' && isEnabled('superscript')) {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
              return true;
            }
            if (lowerKey === 'h' && isEnabled('highlight')) {
              event.preventDefault();
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight');
              return true;
            }
            if (lowerKey === 'z' && isEnabled('undo')) {
              event.preventDefault();
              if (event.shiftKey) {
                if (isEnabled('redo')) {
                  editor.dispatchCommand(REDO_COMMAND, undefined);
                }
              } else {
                editor.dispatchCommand(UNDO_COMMAND, undefined);
              }
              return true;
            }
            if (lowerKey === 'y' && isEnabled('redo')) {
              event.preventDefault();
              editor.dispatchCommand(REDO_COMMAND, undefined);
              return true;
            }
            if (lowerKey === 'k' && isEnabled('link')) {
              event.preventDefault();
              // Link insertion is currently handled via the toolbar popover.
              // In the future, we could trigger the popover from here.
              return true;
            }
          }
          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    );
  }, [editor, isEnabled]);

  return null;
}
