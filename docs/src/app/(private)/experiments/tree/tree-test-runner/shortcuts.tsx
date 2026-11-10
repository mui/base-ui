import * as React from 'react';
import { activeElement } from '@base-ui/utils/shadowDom';
import { ownerDocument } from '@base-ui/utils/owner';
import { platform } from '@base-ui/utils/platform';
import styles from '../tree-test-runner.module.css';

// `Mod` is Command on macOS and Ctrl elsewhere.
export const SHORTCUTS = {
  runAll: { label: 'Run all tests', keys: ['F5'] },
  stop: { label: 'Stop', keys: ['Shift+F5'] },
  runFocused: { label: 'Run the focused test, file, or folder', keys: ['Mod+Enter'] },
  runFailed: { label: 'Rerun failed tests', keys: ['Mod+Shift+Enter'] },
  nextFailure: { label: 'Go to the next failed test', keys: ['F8'] },
  previousFailure: { label: 'Go to the previous failed test', keys: ['Shift+F8'] },
  filter: { label: 'Filter tests', keys: ['Mod+K', '/'] },
  expandAll: { label: 'Expand all', keys: ['Mod+Shift+ArrowDown'] },
  collapseAll: { label: 'Collapse all', keys: ['Mod+Shift+ArrowUp'] },
  help: { label: 'Keyboard shortcuts', keys: ['?'] },
};

export type ShortcutName = keyof typeof SHORTCUTS;

const KEY_LABELS: Record<string, string> = platform.os.mac
  ? { Mod: '⌘', Shift: '⇧', ArrowUp: '↑', ArrowDown: '↓' }
  : { Mod: 'Ctrl', ArrowUp: '↑', ArrowDown: '↓' };

/**
 * A capture-phase keydown handler, so it takes the keys before the tree does.
 * A handler returns `false` to let its key through.
 */
export function createShortcutHandler(
  handlers: Record<ShortcutName, (focused: Element | null) => boolean | void>,
): React.KeyboardEventHandler<HTMLElement> {
  return (event) => {
    const focused = activeElement(ownerDocument(event.currentTarget));
    const inTextField = focused?.matches('input, textarea, select, [contenteditable]') ?? false;
    for (const [name, { keys }] of Object.entries(SHORTCUTS)) {
      if (
        keys.some((combination) => matches(event, combination, inTextField)) &&
        handlers[name as ShortcutName](focused) !== false
      ) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    }
  };
}

function matches(event: React.KeyboardEvent, combination: string, inTextField: boolean) {
  const modifiers = combination.split('+');
  const key = modifiers.pop()!;
  const mod = modifiers.includes('Mod');
  // Text fields keep the characters they type and the arrows that move the caret.
  if (inTextField && ((!mod && key.length === 1) || key.startsWith('Arrow'))) {
    return false;
  }
  const [modPressed, otherPressed] = platform.os.mac
    ? [event.metaKey, event.ctrlKey]
    : [event.ctrlKey, event.metaKey];
  return (
    event.key.toLowerCase() === key.toLowerCase() &&
    modPressed === mod &&
    !otherPressed &&
    !event.altKey &&
    // `?` and `/` take Shift on some keyboard layouts and not on others.
    (/^\W$/.test(key) || event.shiftKey === modifiers.includes('Shift'))
  );
}

export function getAriaKeyShortcuts(name: ShortcutName) {
  return SHORTCUTS[name].keys
    .map((combination) => combination.replace('Mod', platform.os.mac ? 'Meta' : 'Control'))
    .join(' ');
}

export function ShortcutKeys(props: { name: ShortcutName }) {
  return SHORTCUTS[props.name].keys.map((combination, index) => (
    <span key={combination}>
      {index > 0 && ' or'}
      {combination.split('+').map((key) => (
        <kbd key={key} className={styles.Kbd}>
          {KEY_LABELS[key] ?? key}
        </kbd>
      ))}
    </span>
  ));
}
