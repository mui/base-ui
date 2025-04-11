'use client';
import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import styles from './css-anchor-positioning.module.css';

export default function ExamplePopover() {
  return (
    <div
      ref={(node) => {
        if (node) {
          node.scrollLeft = node.scrollWidth / 2 - node.clientWidth / 2;
          node.scrollTop = node.scrollHeight / 2 - node.clientHeight / 2;
        }
      }}
      style={{
        width: 250,
        height: 250,
        background: 'lightgray',
        overflowY: 'scroll',
        marginTop: 100,
      }}
    >
      <div style={{ width: 2000, height: 2000 }}>
        <div style={{ width: 1, height: 2000 }} />
        <Popover.Root defaultOpen>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Popover.Trigger className={styles.Anchor}>Anchor</Popover.Trigger>
          </div>
          <Popover.Portal>
            <Popover.Popup
              className={styles.Popup}
              data-side="bottom"
              data-align="center"
            />
          </Popover.Portal>
        </Popover.Root>
        <div style={{ width: 1, height: 2000 }} />
      </div>
    </div>
  );
}
