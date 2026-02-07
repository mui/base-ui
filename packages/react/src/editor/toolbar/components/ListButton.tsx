'use client';

import * as React from 'react';
import { Button } from '../../../button';
import { useEditor } from '../../hooks/useEditor';
import { useSelection } from '../../hooks/useSelection';

export type ListType = 'bullet' | 'number';

export interface ListButtonProps {
  type: ListType;
  children: React.ReactNode;
  className?: string | undefined;
  'aria-label'?: string | undefined;
}

export function ListButton(props: ListButtonProps) {
  const { type, children, className, 'aria-label': ariaLabel } = props;
  const { commands } = useEditor();
  const selection = useSelection();

  const isSelected = selection.blockType === type;

  return (
    <Button
      className={className}
      data-selected={isSelected}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => commands.toggleList(type === 'bullet' ? 'ul' : 'ol')}
      aria-pressed={isSelected}
      aria-label={ariaLabel || (type === 'bullet' ? 'bullet list' : 'numbered list')}
    >
      {children}
    </Button>
  );
}
