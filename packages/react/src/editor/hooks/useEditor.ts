import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  TextFormatType,
  UNDO_COMMAND,
  REDO_COMMAND
} from 'lexical';

export function useEditor() {
  const [editor] = useLexicalComposerContext();

  const formatText = React.useCallback((format: TextFormatType) => {
    // Ensure the editor retains focus so selection is available
    editor.focus();

    let shouldEnable = false as boolean;
    let conflicting: TextFormatType | null = null;

    // Determine if we are enabling the format and whether a conflicting format is active
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        shouldEnable = !selection.hasFormat(format);
        if (format === 'underline') {
          conflicting = 'strikethrough';
        } else if (format === 'strikethrough') {
          conflicting = 'underline';
        }

        if (shouldEnable && conflicting && selection.hasFormat(conflicting)) {
          // Turn off the conflicting format first to enforce exclusivity
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, conflicting);
        }
      }
    });

    // Toggle the requested format last
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  }, [editor]);

  const undo = React.useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  const redo = React.useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  }, [editor]);

  return {
    editor,
    commands: {
      formatText,
      undo,
      redo,
    },
  };
}
