'use client';

import * as React from 'react';
import { Highlighter, X } from 'lucide-react';
import { Popover } from '@base-ui/react/popover';
import { Button } from '@base-ui/react/button';
import { useEditor, useSelection } from '@base-ui/react/editor';
import classes from './HighlightColorButton.module.css';

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', color: 'var(--editor-highlight-yellow)' },
  { label: 'Pink', color: 'var(--editor-highlight-pink)' },
  { label: 'Blue', color: 'var(--editor-highlight-blue)' },
  { label: 'Green', color: 'var(--editor-highlight-green)' },
  { label: 'Purple', color: 'var(--editor-highlight-purple)' },
  { label: 'Orange', color: 'var(--editor-highlight-orange)' },
];

export interface HighlightColorButtonProps {
  className?: string | undefined;
  popoverClassName?: string | undefined;
}

export function HighlightColorButton(props: HighlightColorButtonProps) {
  const { className, popoverClassName } = props;
  const { commands } = useEditor();
  const selection = useSelection();

  const handleColorSelect = (color: string) => {
    commands.patchStyle({ 'background-color': color });
  };

  const handleRemoveHighlight = () => {
    commands.patchStyle({ 'background-color': '' });
  };

  const isHighlighted = selection.highlightColor !== '';

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button
            className={className}
            data-selected={isHighlighted}
            aria-pressed={isHighlighted}
            aria-label="Highlight color"
          >
            <Highlighter size={18} style={{ fill: selection.highlightColor }} />
          </Button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={popoverClassName}>
            <div className={classes.colorGrid}>
              {HIGHLIGHT_COLORS.map((item) => (
                <Button
                  key={item.color}
                  className={classes.colorButton}
                  style={{ backgroundColor: item.color }}
                  onClick={() => handleColorSelect(item.color)}
                  title={item.label}
                  aria-label={item.label}
                />
              ))}
              <Button
                className={classes.removeButton}
                onClick={handleRemoveHighlight}
                title="Remove highlight"
                aria-label="Remove highlight"
              >
                <X size={14} />
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
