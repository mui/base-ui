'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { ownerDocument } from '@base-ui/utils/owner';
import { activeElement } from '@base-ui/utils/shadowDom';
import styles from './menu.module.css';

export default function NativeButtonFocusExperiment() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [focusAtMouseUp, setFocusAtMouseUp] = React.useState('No mouse press yet');
  const [focusAtClick, setFocusAtClick] = React.useState('No click yet');

  function describeFocus(item: HTMLElement) {
    const focused = activeElement(ownerDocument(item));

    if (focused === item) {
      return 'Menu item (expected)';
    }
    if (focused === inputRef.current) {
      return 'Outside input';
    }
    return focused?.tagName.toLowerCase() ?? 'none';
  }

  return (
    <div className={styles.ExperimentRoot}>
      <h1 className={styles.ExperimentTitle}>Native menu item mouse focus</h1>
      <p className={styles.ExperimentDescription}>
        In Safari, focus the outside input, then click the menu item with a mouse. Hover focus is
        disabled and the menu stays open so the final focus is visible.
      </p>

      <button className={styles.Button} type="button" onClick={() => inputRef.current?.focus()}>
        Focus outside input
      </button>
      <input
        ref={inputRef}
        aria-label="Outside input"
        placeholder="Outside input"
        style={{ border: '1px solid currentColor', padding: '0.5rem' }}
      />

      <p>Focus at mouseup: {focusAtMouseUp}</p>
      <p>Focus at click: {focusAtClick}</p>

      <Menu.Root open modal={false} highlightItemOnHover={false}>
        <Menu.Trigger className={styles.Button}>Menu trigger</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.Positioner} sideOffset={8}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Item
                className={styles.Item}
                nativeButton
                render={<button type="button" aria-label="Native button item" />}
                closeOnClick={false}
                onMouseDown={() => {
                  setFocusAtMouseUp('Waiting for mouseup');
                  setFocusAtClick('Waiting for click');
                }}
                onMouseUp={(event) => setFocusAtMouseUp(describeFocus(event.currentTarget))}
                onClick={(event) => setFocusAtClick(describeFocus(event.currentTarget))}
              >
                Native button item
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
}
