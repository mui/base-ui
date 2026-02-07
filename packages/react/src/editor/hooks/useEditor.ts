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
  $createCodeNode,
} from '@lexical/code';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $setBlocksType } from '@lexical/selection';
import { useStableCallback } from '@base-ui/utils/useStableCallback';

export function useEditor() {
  const [editor] = useLexicalComposerContext();

  const formatText = useStableCallback((format: TextFormatType) => {
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
  });

  const undo = useStableCallback(() => {
    editor.focus();
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  });

  const redo = useStableCallback(() => {
    editor.focus();
    editor.dispatchCommand(REDO_COMMAND, undefined);
  });

  const toggleBlock = useStableCallback((type: 'h1' | 'h2' | 'quote' | 'paragraph' | 'code') => {
    editor.focus();
    editor.update(() => {
      const selection = $getSelection();
      if (type === 'h1' || type === 'h2') {
        $setBlocksType(selection, () => $createHeadingNode(type as HeadingTagType));
      } else if (type === 'quote') {
        $setBlocksType(selection, () => $createQuoteNode());
      } else if (type === 'code') {
        $setBlocksType(selection, () => $createCodeNode());
      } else {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  });

  const toggleList = useStableCallback((type: 'ul' | 'ol') => {
    editor.focus();
    if (type === 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  });

  const removeList = useStableCallback(() => {
    editor.focus();
    editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
  });

  const toggleLink = useStableCallback((url: string | null) => {
    editor.focus();
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  });

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
