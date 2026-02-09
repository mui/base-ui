'use client'

import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
  $isElementNode,
  ElementNode,
  ElementFormatType,
} from 'lexical';
import { $getSelectionStyleValueForProperty } from '@lexical/selection';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import { $isHeadingNode, HeadingNode } from '@lexical/rich-text';
import { $isCodeNode } from '@lexical/code';
import { $isListNode, ListNode } from '@lexical/list';
import { $isLinkNode, LinkNode } from '@lexical/link';
import { useStableCallback } from '@base-ui/utils/useStableCallback';

export function useSelection() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);
  const [isStrikethrough, setIsStrikethrough] = React.useState(false);
  const [isSubscript, setIsSubscript] = React.useState(false);
  const [isSuperscript, setIsSuperscript] = React.useState(false);
  const [isHighlight, setIsHighlight] = React.useState(false);
  const [highlightColor, setHighlightColor] = React.useState('');
  const [isCode, setIsCode] = React.useState(false);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);
  const [blockType, setBlockType] = React.useState('paragraph');
  const [elementFormat, setElementFormat] = React.useState<ElementFormatType>('left');
  const [isLink, setIsLink] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');

  const updateToolbar = useStableCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsHighlight(selection.hasFormat('highlight'));
      setHighlightColor($getSelectionStyleValueForProperty(selection, 'background-color', ''));
      setIsCode(selection.hasFormat('code'));

      const anchorNode = selection.anchor.getNode();
      const parent = anchorNode.getParent();
      if ($isLinkNode(parent)) {
        setIsLink(true);
        setLinkUrl((parent as LinkNode).getURL());
      } else if ($isLinkNode(anchorNode)) {
        setIsLink(true);
        setLinkUrl((anchorNode as LinkNode).getURL());
      } else {
        setIsLink(false);
        setLinkUrl('');
      }

      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      if ($isElementNode(element)) {
        setElementFormat(element.getFormatType() || 'left');
      } else {
        setElementFormat('left');
      }

      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isHeadingNode(element)) {
          setBlockType((element as HeadingNode).getTag());
        } else if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : (element as ListNode).getListType();
          setBlockType(type);
        } else if ($isCodeNode(element)) {
          setBlockType('code');
        } else if ($isElementNode(element)) {
          setBlockType((element as ElementNode).getType());
        } else {
          setBlockType(element.getType());
        }
      }
    }
  });

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload as boolean);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload as boolean);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [editor, updateToolbar]);

  return {
    isBold,
    isItalic,
    isUnderline,
    isStrikethrough,
    isSubscript,
    isSuperscript,
    isHighlight,
    highlightColor,
    isCode,
    canUndo,
    canRedo,
    blockType,
    elementFormat,
    isLink,
    linkUrl,
  };
}
