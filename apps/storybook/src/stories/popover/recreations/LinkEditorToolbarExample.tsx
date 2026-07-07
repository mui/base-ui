import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { Toolbar } from '@base-ui/react/toolbar';
import styles from '../popover.module.css';

/**
 * Recreation of the link editor in the flashtype markdown editor's formatting
 * toolbar: `Toolbar.Button` composes `Popover.Trigger` via `render` inside a
 * roving-tabindex toolbar, and `initialFocus` routes focus straight to the URL
 * input, past the "Remove link" button (the same idea as Gutenberg's
 * deprioritized-initial-focus hook). Recomposed from opral/flashtype
 * `formatting-toolbar.tsx` (MIT, code-ok,
 * research/d-real-world-usage/popover/ranked.json #3).
 */
export function LinkEditorToolbarExample() {
  const urlInputRef = React.useRef<HTMLInputElement>(null);
  const [href, setHref] = React.useState('https://example.com/docs');
  const [draft, setDraft] = React.useState(href);
  return (
    <div className={styles.Stack}>
      <Toolbar.Root className={styles.Toolbar}>
        <Toolbar.Button className={styles.IconButton} aria-label="Bold">
          B
        </Toolbar.Button>
        <Toolbar.Button className={styles.IconButton} aria-label="Italic">
          I
        </Toolbar.Button>
        <Popover.Root>
          <Toolbar.Button className={styles.Button} render={<Popover.Trigger />}>
            Edit link
          </Toolbar.Button>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup className={styles.Popup} initialFocus={urlInputRef}>
                <Popover.Close className={styles.Button} onClick={() => setHref('')}>
                  Remove link
                </Popover.Close>
                <label className={styles.Label}>
                  URL
                  <input
                    ref={urlInputRef}
                    className={styles.Input}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                </label>
                <Popover.Close className={styles.Button} onClick={() => setHref(draft)}>
                  Save
                </Popover.Close>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </Toolbar.Root>
      <output className={styles.Output}>href: {href || 'none'}</output>
    </div>
  );
}
