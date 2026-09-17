'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';

import styles from '../../hero.module.css';

const itemKind = Draggable.createKind('drop-target/hero-item');

function DropTargetHeroContent() {
  const [dropped, setDropped] = React.useState(false);

  return (
    <div className={styles.Root}>
      <div className={styles.Source}>
        <Draggable.Root className={styles.Item} data-dropped={dropped || undefined} kind={itemKind}>
          Drop me
        </Draggable.Root>
        {dropped && (
          <button type="button" className={styles.Reset} onClick={() => setDropped(false)}>
            Reset
          </button>
        )}
      </div>
      <Draggable.Target
        className={styles.Target}
        // @highlight-start
        accept={itemKind}
        onDraggableDrop={() => setDropped(true)}
        // @highlight-end
      >
        {!dropped && <span className={styles.Hint}>Drop here</span>}
      </Draggable.Target>
    </div>
  );
}

export default function DropTargetHero() {
  return (
    <Draggable.Provider>
      <DropTargetHeroContent />
    </Draggable.Provider>
  );
}
