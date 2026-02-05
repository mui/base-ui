import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  TextFormatType,
  UNDO_COMMAND,
  REDO_COMMAND,
  $createParagraphNode,
} from 'lexical';
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $setBlocksType } from '@lexical/selection';

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
    editor.focus();
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  const redo = React.useCallback(() => {
    editor.focus();
    editor.dispatchCommand(REDO_COMMAND, undefined);
  }, [editor]);

  const toggleBlock = React.useCallback((type: 'h1' | 'h2' | 'quote' | 'paragraph') => {
    editor.focus();
    editor.update(() => {
      const selection = $getSelection();
      if (type === 'h1' || type === 'h2') {
        $setBlocksType(selection, () => $createHeadingNode(type as HeadingTagType));
      } else if (type === 'quote') {
        $setBlocksType(selection, () => $createQuoteNode());
      } else {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  }, [editor]);

  const toggleList = React.useCallback((type: 'ul' | 'ol') => {
    editor.focus();
    if (type === 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  }, [editor]);

  const removeList = React.useCallback(() => {
    editor.focus();
    editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
  }, [editor]);

  const toggleLink = React.useCallback((url: string | null) => {
    editor.focus();
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  }, [editor]);

  return {
    editor,
    commands: {
      formatText,
      undo,
      redo,
      toggleBlock,
      toggleList,
      removeList,
      toggleLink,
    },
  };
}
