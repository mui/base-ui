'use client';

import * as React from 'react';
import { Code } from 'docs/src/components/Code';
import { Kbd } from 'docs/src/components/Kbd/Kbd';
import styles from './SketchKeyControl.module.css';

const actions = ['Rename', 'Duplicate', 'Move to folder', 'Archive', 'Delete'];
const keyLabels: Record<string, string> = {
  ArrowDown: 'Down Arrow',
  ArrowUp: 'Up Arrow',
  Home: 'Home',
  End: 'End',
  Enter: 'Enter',
  ' ': 'Space',
};

export default function SketchKeyControl() {
  const id = React.useId();
  const [query, setQuery] = React.useState('');
  // The input is an extra stop in the navigation loop.
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const [lastKey, setLastKey] = React.useState('—');
  const [lastAction, setLastAction] = React.useState('');
  const visibleActions = actions.filter((action) =>
    action.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const isEditing = highlightedIndex === -1;
  const menuId = `${id}-menu`;

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const { key } = event;
    if (keyLabels[key]) {
      setLastKey(keyLabels[key]);
    }

    if (event.nativeEvent.isComposing) {
      return;
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault();
      if (visibleActions.length === 0) {
        return;
      }
      if (key === 'ArrowDown') {
        setHighlightedIndex(
          highlightedIndex === visibleActions.length - 1 ? -1 : highlightedIndex + 1,
        );
      } else {
        setHighlightedIndex(isEditing ? visibleActions.length - 1 : highlightedIndex - 1);
      }
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault();
      if (!isEditing) {
        setHighlightedIndex(key === 'Home' ? 0 : visibleActions.length - 1);
        return;
      }

      // Explicit caret movement also works on macOS, where Home/End can scroll the page.
      const input = event.currentTarget;
      const position = key === 'Home' ? 0 : input.value.length;
      if (event.shiftKey) {
        const anchor =
          (input.selectionDirection === 'backward' ? input.selectionEnd : input.selectionStart) ??
          0;
        input.setSelectionRange(
          Math.min(anchor, position),
          Math.max(anchor, position),
          position < anchor ? 'backward' : 'forward',
        );
      } else {
        input.setSelectionRange(position, position);
      }
    } else if (key === 'Enter') {
      event.preventDefault();
      if (!isEditing) {
        setLastAction(visibleActions[highlightedIndex]);
      }
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
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlightedIndex(-1);
            setLastAction('');
          }}
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
            <dd>{isEditing ? 'input' : visibleActions[highlightedIndex]}</dd>
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
