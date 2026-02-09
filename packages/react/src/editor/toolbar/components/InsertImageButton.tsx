'use client';

import * as React from 'react';
import { Button } from '@base-ui/react/button';
import { Popover } from '@base-ui/react/popover';
import { useEditor } from '@base-ui/react/editor';

export interface InsertImageButtonProps {
  children: React.ReactNode;
  className?: string | undefined;
  popoverClassName?: string | undefined;
  formClassName?: string | undefined;
  inputClassName?: string | undefined;
  applyButtonClassName?: string | undefined;
  'aria-label'?: string | undefined;
}

export function InsertImageButton(props: InsertImageButtonProps) {
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
  const [src, setSrc] = React.useState('');
  const [altText, setAltText] = React.useState('');
  const [open, setOpen] = React.useState(false);

  const handleImageSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (src) {
      commands.insertImage(src, altText);
      setSrc('');
      setAltText('');
      setOpen(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        render={
          <Button
            className={className}
            aria-label={ariaLabel || 'insert image'}
          >
            {children}
          </Button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup className={popoverClassName}>
            <form onSubmit={handleImageSubmit} className={formClassName}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input
                  className={inputClassName}
                  value={src}
                  onChange={(event) => setSrc(event.target.value)}
                  placeholder="Image URL (https://...)"
                  autoFocus
                />
                <input
                  className={inputClassName}
                  value={altText}
                  onChange={(event) => setAltText(event.target.value)}
                  placeholder="Alt text"
                />
                <Button type="submit" className={applyButtonClassName} disabled={!src}>
                  Insert Image
                </Button>
              </div>
            </form>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
