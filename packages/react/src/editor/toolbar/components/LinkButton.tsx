'use client';

import * as React from 'react';
import { Button } from '../../../button';
import { Popover } from '../../../popover';
import { useEditor } from '../../hooks/useEditor';
import { useSelection } from '../../hooks/useSelection';

export interface LinkButtonProps {
  children: React.ReactNode;
  className?: string | undefined;
  popoverClassName?: string | undefined;
  formClassName?: string | undefined;
  inputClassName?: string | undefined;
  applyButtonClassName?: string | undefined;
  'aria-label'?: string | undefined;
}

export function LinkButton(props: LinkButtonProps) {
  const {
    children,
    className,
    popoverClassName,
    formClassName,
    inputClassName,
    applyButtonClassName,
    'aria-label': ariaLabel,
  } = props;
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
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button
            className={className}
            data-selected={selection.isLink}
            aria-pressed={selection.isLink}
            aria-label={ariaLabel || 'link'}
          >
            {children}
          </Button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={popoverClassName}>
            <form onSubmit={handleLinkSubmit} className={formClassName}>
              <input
                className={inputClassName}
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://..."
                autoFocus
              />
              <Button type="submit" className={applyButtonClassName}>
                Apply
              </Button>
            </form>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
