'use client';

import * as React from 'react';
import { Code } from 'docs/src/components/Code';
import { Kbd } from 'docs/src/components/Kbd/Kbd';
import styles from './DemoKeyControl.module.css';

// The input is an extra stop in the navigation loop, before the first action.
const INPUT_INDEX = -1;

const actions = ['Rename', 'Duplicate', 'Move to folder', 'Archive', 'Delete'];
const keyLabels: Record<string, string> = {
  ArrowDown: 'Down Arrow',
  ArrowUp: 'Up Arrow',
  Home: 'Home',
  End: 'End',
  Enter: 'Enter',
  ' ': 'Space',
};

export default function DemoKeyControl() {
  const id = React.useId();
  const [query, setQuery] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(INPUT_INDEX);
  const [lastKey, setLastKey] = React.useState('—');
  const [lastAction, setLastAction] = React.useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const visibleActions = actions.filter((action) => action.toLowerCase().includes(normalizedQuery));
  const lastActionIndex = visibleActions.length - 1;
  const highlightedAction = visibleActions[highlightedIndex];
  const isEditing = highlightedIndex === INPUT_INDEX;
  const menuId = `${id}-menu`;

  function handleQueryChange(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.currentTarget.value);
    setHighlightedIndex(INPUT_INDEX);
    setLastAction('');
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const { key } = event;
    if (keyLabels[key]) {
      setLastKey(keyLabels[key]);
    }

    if (event.nativeEvent.isComposing) {
      return;
    }

    switch (key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (visibleActions.length === 0) {
          return;
        }

        if (key === 'ArrowDown') {
          setHighlightedIndex(
            highlightedIndex === lastActionIndex ? INPUT_INDEX : highlightedIndex + 1,
          );
        } else {
          setHighlightedIndex(isEditing ? lastActionIndex : highlightedIndex - 1);
        }
        return;

      case 'Home':
      case 'End':
        event.preventDefault();
        if (isEditing) {
          const input = event.currentTarget;
          const position = key === 'Home' ? 0 : input.value.length;
          moveCaret(input, position, event.shiftKey);
        } else {
          setHighlightedIndex(key === 'Home' ? 0 : lastActionIndex);
        }
        return;

      case 'Enter':
        event.preventDefault();
        if (!isEditing) {
          setLastAction(highlightedAction);
        }
        return;

      default:
        return;
    }
  }

  return (
    <div className={styles.Lab}>
      <div className={styles.Mini}>
        <input
          className={styles.Input}
          role="searchbox"
          aria-label="Filter actions"
          aria-controls={menuId}
          aria-activedescendant={isEditing ? undefined : `${id}-item-${highlightedIndex}`}
          data-highlighted={isEditing ? '' : undefined}
          placeholder="Filter actions"
          autoComplete="off"
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
        />
        <ul id={menuId} className={styles.Menu} role="menu" aria-label="Edit actions">
          {visibleActions.map((action, index) => (
            <li key={action} role="none">
              <button
                id={`${id}-item-${index}`}
                className={styles.Item}
                type="button"
                role="menuitem"
                tabIndex={-1}
                data-highlighted={index === highlightedIndex ? '' : undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setLastAction(action)}
              >
                {action}
              </button>
            </li>
          ))}
        </ul>
        {visibleActions.length === 0 && <div className={styles.Empty}>No actions found.</div>}
      </div>
      <div className={styles.Readout}>
        <div aria-live="polite">
          <dl className={styles.Values}>
            <dt>Context</dt>
            <dd>
              <Code>{isEditing ? 'Editing' : 'Browsing'}</Code>
            </dd>
            <dt>Highlighted</dt>
            <dd>{isEditing ? 'input' : highlightedAction}</dd>
            <dt>Last key</dt>
            <dd>{lastKey}</dd>
          </dl>
          <div className={styles.Log}>{lastAction && `Ran "${lastAction}"`}</div>
        </div>
        <div className={styles.Hint}>
          <p>Type in the field to filter the menu.</p>
          <p>
            Try <Kbd>↓</Kbd>, <Kbd>Home</Kbd>, and <Kbd>End</Kbd> to navigate.
          </p>
          <p>
            Press <Kbd>↓</Kbd> past the last item to return to editing.
          </p>
        </div>
      </div>
    </div>
  );
}

function moveCaret(input: HTMLInputElement, position: number, extendSelection: boolean) {
  // Explicit caret movement also works on macOS, where Home/End can scroll the page.
  if (!extendSelection) {
    input.setSelectionRange(position, position);
    return;
  }

  // Extend from the fixed end of the selection, not the end that moves with the caret.
  const anchor =
    (input.selectionDirection === 'backward' ? input.selectionEnd : input.selectionStart) ?? 0;
  input.setSelectionRange(
    Math.min(anchor, position),
    Math.max(anchor, position),
    position < anchor ? 'backward' : 'forward',
  );
}
