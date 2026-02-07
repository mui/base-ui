'use client';

import * as React from 'react';
import { Button } from '../../../button';
import { useEditor } from '../../hooks/useEditor';
import { useSelection } from '../../hooks/useSelection';

export type BlockType = 'h1' | 'h2' | 'quote' | 'paragraph' | 'code';

export interface BlockButtonProps {
  type: BlockType;
  children: React.ReactNode;
  className?: string | undefined;
  'aria-label'?: string | undefined;
}

export function BlockButton(props: BlockButtonProps) {
  const { type, children, className, 'aria-label': ariaLabel } = props;
  const { commands } = useEditor();
  const selection = useSelection();

  const isSelected = selection.blockType === type;

  return (
    <Button
      className={className}
      data-selected={isSelected}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => commands.toggleBlock(type)}
      aria-pressed={isSelected}
      aria-label={ariaLabel || type}
    >
      {children}
    </Button>
  );
}
