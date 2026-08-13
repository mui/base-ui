'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import styles from '../../hero.module.css';

const itemKind = Draggable.createKind('drop-target/hero-item');

export default function DropTargetHero() {
  const [dropped, setDropped] = React.useState(false);

  return (
    <div className={styles.Root}>
      <div className={styles.Source}>
        <Draggable.Root
          className={styles.Item}
          data-dropped={dropped || undefined}
          kind={itemKind}
          label="Item"
          role="button"
          tabIndex={0}
        >
          Drop me
        </Draggable.Root>
        {dropped && (
          <button type="button" className={styles.Reset} onClick={() => setDropped(false)}>
            Reset
          </button>
        )}
      </div>
      <DropTarget.Root
        className={styles.Target}
        label="Drop zone"
        accept={itemKind}
        onDrop={() => setDropped(true)}
      >
        {!dropped && <span className={styles.Hint}>Drop here</span>}
      </DropTarget.Root>
    </div>
  );
}
