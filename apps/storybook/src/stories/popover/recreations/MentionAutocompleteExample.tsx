import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import styles from '../popover.module.css';

/**
 * Recreation of the @-mention file autocomplete in takopi (a personal AI
 * assistant): a triggerless, fully controlled popover anchored to the textarea
 * with `anchor={textareaRef}` and `side="top"`, plus `initialFocus={false}` and
 * `finalFocus={false}` so keyboard focus never leaves the textarea. Recomposed
 * from egoist/takopi `mention-popover.tsx` (Apache-2.0, code-ok,
 * research/d-real-world-usage/popover/ranked.json #5).
 */

const mentionFiles = ['README.md', 'package.json', 'src/index.ts', 'src/theme.css'];

export function MentionAutocompleteExample() {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);

  function insertMention(file: string) {
    setMessage((current) => `${current}${file} `);
    setOpen(false);
    textareaRef.current?.focus();
  }

  return (
    <div className={styles.Stack}>
      <textarea
        ref={textareaRef}
        className={styles.Textarea}
        aria-label="Message"
        placeholder="Type @ to mention a file"
        rows={3}
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          setOpen(event.target.value.endsWith('@'));
        }}
      />
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Portal>
          <Popover.Positioner anchor={textareaRef} side="top" align="start" sideOffset={4}>
            <Popover.Popup className={styles.Popup} initialFocus={false} finalFocus={false}>
              <ul className={styles.QueueList}>
                {mentionFiles.map((file) => (
                  <li key={file}>
                    <button
                      type="button"
                      tabIndex={-1}
                      className={styles.MentionItem}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => insertMention(file)}
                    >
                      {file}
                    </button>
                  </li>
                ))}
              </ul>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
