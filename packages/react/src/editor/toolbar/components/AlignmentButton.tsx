'use client';

import * as React from 'react';
import { type ElementFormatType } from 'lexical';
import { Button } from '@base-ui/react/button';
import { useEditor, useSelection } from '@base-ui/react/editor';

export interface AlignmentButtonProps {
  format: ElementFormatType;
  children: React.ReactNode;
  className?: string | undefined;
  'aria-label'?: string | undefined;
}

export function AlignmentButton(props: AlignmentButtonProps) {
  const { format, children, className, 'aria-label': ariaLabel } = props;
  const { commands } = useEditor();
  const selection = useSelection();

  const isSelected = selection.elementFormat === format;

  return (
    <Button
      className={className}
      data-selected={isSelected}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => commands.formatElement(format)}
      aria-pressed={isSelected}
      aria-label={ariaLabel || format}
    >
      {children}
    </Button>
  );
}
