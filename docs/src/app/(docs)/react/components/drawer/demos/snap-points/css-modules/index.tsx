'use client';
import * as React from 'react';
import { Drawer } from '@base-ui/react/drawer';
import styles from './index.module.css';

const TOP_MARGIN_REM = 1;
const SNAP_POINTS_REM = [15, 30];

const snapPoints = [...SNAP_POINTS_REM.map((offset) => `${offset + TOP_MARGIN_REM}rem`), 1];

export default function ExampleDrawerSnapPoints() {
  return (
    <Drawer.Root snapPoints={snapPoints}>
      <Drawer.Trigger className={styles.Button}>Open snap drawer</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop className={styles.Backdrop} />
        <Drawer.Viewport className={styles.Viewport}>
          <Drawer.Popup
            className={styles.Popup}
            style={{ '--top-margin': `${TOP_MARGIN_REM}rem` } as React.CSSProperties}
          >
            <div className={styles.Handle} />
            <div className={styles.Scroll}>
              <Drawer.Content className={styles.Content}>
                <Drawer.Title className={styles.Title}>Snap points</Drawer.Title>
                <Drawer.Description className={styles.Description}>
                  Drag the sheet to snap between a compact peek, a mid-height workspace, and a near
                  full-height view.
                </Drawer.Description>
                <div className={styles.Cards} aria-hidden>
                  {Array.from({ length: 20 }, (_, index) => (
                    <div className={styles.Card} key={index} />
                  ))}
                </div>
                <div className={styles.Actions}>
                  <Drawer.Close className={styles.Button}>Close</Drawer.Close>
                </div>
              </Drawer.Content>
            </div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
