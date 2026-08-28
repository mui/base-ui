'use client';
import * as React from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';
import styles from './index.module.css';

export default function ExampleAutocompleteKeyboardShortcuts() {
  const actionsRef = React.useRef<Autocomplete.Root.Actions>(null);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (!event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    // Lower-cased so the shortcuts still work with Caps Lock on or Shift held.
    const target = shortcuts[event.key.toLowerCase()];
    if (!target) {
      return;
    }

    event.preventDefault();
    actionsRef.current?.highlightItem(target);
  }

  return (
    <Autocomplete.Root
      items={commands}
      actionsRef={actionsRef}
      // Passing `actionsRef` makes unmounting the popup your responsibility, so release it
      // once the list closes. This demo has no exit animation, so it can unmount right away.
      onOpenChange={(open) => {
        if (!open) {
          actionsRef.current?.unmount();
        }
      }}
    >
      <div className={styles.Field}>
        <label className={styles.Label}>
          Search commands
          <Autocomplete.Input
            placeholder="e.g. commit"
            className={styles.Input}
            onKeyDown={handleKeyDown}
          />
        </label>
        <p className={styles.Hint}>Navigate with Ctrl+N and Ctrl+P.</p>
      </div>

      <Autocomplete.Portal>
        <Autocomplete.Positioner className={styles.Positioner} sideOffset={4}>
          <Autocomplete.Popup className={styles.Popup}>
            <Autocomplete.Empty>
              <div className={styles.Empty}>No commands found.</div>
            </Autocomplete.Empty>
            <Autocomplete.List className={styles.List}>
              {(command: string) => (
                <Autocomplete.Item key={command} className={styles.Item} value={command}>
                  {command}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}

const shortcuts: Record<string, Autocomplete.Root.HighlightItemTarget> = {
  n: 'next',
  p: 'previous',
};

const commands = [
  'Commit changes',
  'Create branch',
  'Discard changes',
  'Fetch origin',
  'Open pull request',
  'Pull changes',
  'Push changes',
  'Stash changes',
  'Switch branch',
  'View history',
];
