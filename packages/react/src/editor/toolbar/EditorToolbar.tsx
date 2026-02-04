import * as React from 'react';
import { Button } from '../../button';
import classes from './EditorToolbar.module.css';
import { useEditor } from '../hooks/useEditor';
import { useSelection } from '../hooks/useSelection';

export function EditorToolbar() {
  const { commands } = useEditor();
  const selection = useSelection();

  return (
    <div className={classes.root}>
      <div className={classes.buttonGroup} role="group" aria-label="text formatting">
        <Button
          className={classes.button}
          data-selected={selection.isBold}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.formatText('bold')}
          aria-pressed={selection.isBold}
          aria-label="bold"
        >
          B
        </Button>
        <Button
          className={classes.button}
          data-selected={selection.isItalic}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.formatText('italic')}
          aria-pressed={selection.isItalic}
          aria-label="italic"
          style={{ fontStyle: 'italic' }}
        >
          I
        </Button>
        <Button
          className={classes.button}
          data-selected={selection.isUnderline}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.formatText('underline')}
          aria-pressed={selection.isUnderline}
          aria-label="underline"
          style={{ textDecoration: 'underline' }}
        >
          U
        </Button>
        <Button
          className={classes.button}
          data-selected={selection.isStrikethrough}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.formatText('strikethrough')}
          aria-pressed={selection.isStrikethrough}
          aria-label="strikethrough"
          style={{ textDecoration: 'line-through' }}
        >
          S
        </Button>
      </div>

      <div className={classes.divider} aria-hidden="true" />

      {/* Undo/Redo handled via keyboard shortcuts; buttons available if desired */}
      {/* <Button className={classes.button} onClick={commands.undo} disabled={!selection.canUndo} aria-label="undo">↶</Button>
      <Button className={classes.button} onClick={commands.redo} disabled={!selection.canRedo} aria-label="redo">↷</Button> */}
    </div>
  );
}
