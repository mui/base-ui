'use client';

/**
 * Icons: Lucide (ISC License)
 * See LICENSE-lucide in this directory for the full license text.
 */

import * as React from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Quote,
  Type,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from 'lucide-react';
import { Button } from '../../button';
import { Popover } from '../../popover';
import classes from './EditorToolbar.module.css';
import { useEditor } from '../hooks/useEditor';
import { useSelection } from '../hooks/useSelection';

export function EditorToolbar() {
  const { commands } = useEditor();
  const selection = useSelection();
  const [linkUrl, setLinkUrl] = React.useState('');

  React.useEffect(() => {
    if (selection.isLink) {
      setLinkUrl(selection.linkUrl);
    }
  }, [selection.isLink, selection.linkUrl]);

  const handleLinkSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    commands.toggleLink(linkUrl);
  };

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
          <Bold size={18} />
        </Button>
        <Button
          className={classes.button}
          data-selected={selection.isItalic}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.formatText('italic')}
          aria-pressed={selection.isItalic}
          aria-label="italic"
        >
          <Italic size={18} />
        </Button>
        <Button
          className={classes.button}
          data-selected={selection.isUnderline}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.formatText('underline')}
          aria-pressed={selection.isUnderline}
          aria-label="underline"
        >
          <Underline size={18} />
        </Button>
        <Button
          className={classes.button}
          data-selected={selection.isStrikethrough}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.formatText('strikethrough')}
          aria-pressed={selection.isStrikethrough}
          aria-label="strikethrough"
        >
          <Strikethrough size={18} />
        </Button>
      </div>

      <div className={classes.divider} aria-hidden="true" />

      <div className={classes.buttonGroup} role="group" aria-label="block formatting">
        <Button
          className={classes.button}
          data-selected={selection.blockType === 'h1'}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.toggleBlock('h1')}
          aria-pressed={selection.blockType === 'h1'}
          aria-label="heading 1"
        >
          <Heading1 size={18} />
        </Button>
        <Button
          className={classes.button}
          data-selected={selection.blockType === 'h2'}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.toggleBlock('h2')}
          aria-pressed={selection.blockType === 'h2'}
          aria-label="heading 2"
        >
          <Heading2 size={18} />
        </Button>
        <Button
          className={classes.button}
          data-selected={selection.blockType === 'quote'}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.toggleBlock('quote')}
          aria-pressed={selection.blockType === 'quote'}
          aria-label="blockquote"
        >
          <Quote size={18} />
        </Button>
        <Button
          className={classes.button}
          data-selected={selection.blockType === 'paragraph'}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.toggleBlock('paragraph')}
          aria-pressed={selection.blockType === 'paragraph'}
          aria-label="paragraph"
        >
          <Type size={18} />
        </Button>
      </div>

      <div className={classes.divider} aria-hidden="true" />

      <div className={classes.buttonGroup} role="group" aria-label="lists">
        <Button
          className={classes.button}
          data-selected={selection.blockType === 'bullet'}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.toggleList('ul')}
          aria-pressed={selection.blockType === 'bullet'}
          aria-label="bullet list"
        >
          <List size={18} />
        </Button>
        <Button
          className={classes.button}
          data-selected={selection.blockType === 'number'}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => commands.toggleList('ol')}
          aria-pressed={selection.blockType === 'number'}
          aria-label="numbered list"
        >
          <ListOrdered size={18} />
        </Button>
      </div>

      <div className={classes.divider} aria-hidden="true" />

      <div className={classes.buttonGroup} role="group" aria-label="links">
        <Popover.Root>
          <Popover.Trigger
            render={
              <Button
                className={classes.button}
                data-selected={selection.isLink}
                aria-pressed={selection.isLink}
                aria-label="link"
              >
                <LinkIcon size={18} />
              </Button>
            }
          />
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className={classes.popoverPopup}>
                <form onSubmit={handleLinkSubmit} className={classes.linkForm}>
                  <input
                    className={classes.linkInput}
                    value={linkUrl}
                    onChange={(event) => setLinkUrl(event.target.value)}
                    placeholder="https://..."
                    autoFocus
                  />
                  <Button type="submit" className={classes.linkButton}>
                    Apply
                  </Button>
                </form>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <div className={classes.divider} aria-hidden="true" />

      <div className={classes.buttonGroup} role="group" aria-label="history">
        <Button
          className={classes.button}
          onClick={() => commands.undo()}
          disabled={!selection.canUndo}
          aria-label="undo"
        >
          <Undo2 size={18} />
        </Button>
        <Button
          className={classes.button}
          onClick={() => commands.redo()}
          disabled={!selection.canRedo}
          aria-label="redo"
        >
          <Redo2 size={18} />
        </Button>
      </div>
    </div>
  );
}
