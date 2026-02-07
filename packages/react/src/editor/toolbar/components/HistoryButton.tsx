'use client';

import * as React from 'react';
import { Button } from '../../../button';
import { useEditor } from '../../hooks/useEditor';
import { useSelection } from '../../hooks/useSelection';

export type HistoryType = 'undo' | 'redo';

export interface HistoryButtonProps {
  type: HistoryType;
  children: React.ReactNode;
  className?: string | undefined;
  'aria-label'?: string | undefined;
}

export function HistoryButton(props: HistoryButtonProps) {
  const { type, children, className, 'aria-label': ariaLabel } = props;
  const { commands } = useEditor();
  const selection = useSelection();

  const isDisabled = type === 'undo' ? !selection.canUndo : !selection.canRedo;

  return (
    <Button
      className={className}
      onClick={() => (type === 'undo' ? commands.undo() : commands.redo())}
      disabled={isDisabled}
      aria-label={ariaLabel || type}
    >
      {children}
    </Button>
  );
}
