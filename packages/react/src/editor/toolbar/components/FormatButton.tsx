'use client';

import * as React from 'react';
import { type TextFormatType } from 'lexical';
import { Button } from '@base-ui/react/button';
import { useEditor, useSelection } from '@base-ui/react/editor';

export interface FormatButtonProps {
  format: TextFormatType;
  children: React.ReactNode;
  className?: string | undefined;
  'aria-label'?: string | undefined;
}

export function FormatButton(props: FormatButtonProps) {
  const { format, children, className, 'aria-label': ariaLabel } = props;
  const { commands } = useEditor();
  const selection = useSelection();

  const isSelected = React.useMemo(() => {
    switch (format) {
      case 'bold': return selection.isBold;
      case 'italic': return selection.isItalic;
      case 'underline': return selection.isUnderline;
      case 'strikethrough': return selection.isStrikethrough;
      case 'subscript': return selection.isSubscript;
      case 'superscript': return selection.isSuperscript;
      case 'code': return selection.isCode;
      case 'highlight': return selection.isHighlight;
      default: return false;
    }
  }, [format, selection]);

  return (
    <Button
      className={className}
      data-selected={isSelected}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => commands.formatText(format)}
      aria-pressed={isSelected}
      aria-label={ariaLabel || format}
    >
      {children}
    </Button>
  );
}
