'use client';

import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  BLUR_COMMAND,
  FOCUS_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
} from 'lucide-react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import classes from './EditorFloatingToolbar.module.css';
import { FormatButton } from '../toolbar/components/FormatButton';
import { LinkButton } from '../toolbar/components/LinkButton';

export interface EditorFloatingToolbarProps {
  /** Optional offset in pixels applied to the toolbar position. */
  offset?: number | undefined;
}

export function EditorFloatingToolbar(props: EditorFloatingToolbarProps) {
  const { offset = 8 } = props;
  const [editor] = useLexicalComposerContext();

  const [visible, setVisible] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);

  const updateFromSelection = useStableCallback(() => {
    const isCurrentlyFocused = editor.getEditorState().read(() => {
      return editor.getRootElement() === document.activeElement || editor.getRootElement()?.contains(document.activeElement);
    });

    if (!isCurrentlyFocused && !isFocused) {
      setVisible(false);
      return;
    }

    const winSel = window.getSelection();
    if (!winSel || winSel.rangeCount === 0) {
      setVisible(false);
      setPosition(null);
      return;
    }

    const range = winSel.getRangeAt(0);

    const shouldShow = editor.getEditorState().read(() => {
      const sel = $getSelection();
      return $isRangeSelection(sel) && !sel.isCollapsed();
    });

    if (!shouldShow) {
      setVisible(false);
      setPosition(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (rect && rect.width >= 0 && rect.height >= 0) {
      const top = Math.max(8, rect.top - offset);
      const left = Math.max(8, rect.left + rect.width / 2);
      setPosition({ top, left });
      setVisible(true);
    } else {
      setVisible(false);
      setPosition(null);
    }
  });

  React.useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateFromSelection();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          setIsFocused(true);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          setIsFocused(false);
          setVisible(false);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerUpdateListener(() => {
        updateFromSelection();
      }),
    );
  }, [editor, updateFromSelection]);

  React.useEffect(() => {
    const onScrollOrResize = () => updateFromSelection();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [updateFromSelection]);

  if (!visible || !position) {
    return null;
  }

  const style: React.CSSProperties = {
    top: position.top,
    left: position.left,
    transform: 'translate(-50%, -100%)',
  };

  return (
    <div className={classes.root} style={style} role="toolbar" aria-label="Floating text formatting">
      <FormatButton format="bold" className={classes.button} aria-label="bold">
        <Bold size={18} />
      </FormatButton>
      <FormatButton format="italic" className={classes.button} aria-label="italic">
        <Italic size={18} />
      </FormatButton>
      <FormatButton format="underline" className={classes.button} aria-label="underline">
        <Underline size={18} />
      </FormatButton>
      <FormatButton format="strikethrough" className={classes.button} aria-label="strikethrough">
        <Strikethrough size={18} />
      </FormatButton>
      <LinkButton
        className={classes.button}
        popoverClassName={classes.popoverPopup}
        formClassName={classes.linkForm}
        inputClassName={classes.linkInput}
        applyButtonClassName={classes.linkButton}
        aria-label="link"
      >
        <LinkIcon size={18} />
      </LinkButton>
    </div>
  );
}
