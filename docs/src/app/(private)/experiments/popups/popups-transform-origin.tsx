import * as React from 'react';
import { Popover as PopoverPrimitive } from '@base-ui-components/react/popover';
import styles from './popups-transform-origin.module.css';
import type { Side } from '../../../../../../packages/react/src/utils/useAnchorPositioning';

function Popover({ side }: { side: Side }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger className={styles.Trigger}>
        {side}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side={side} sideOffset={20}>
          <PopoverPrimitive.Popup className={styles.Popup} />
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function PopoverWithArrow({ side }: { side: Side }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger className={styles.Trigger}>
        {side}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner side={side} sideOffset={20}>
          <PopoverPrimitive.Popup className={styles.Popup}>
            <PopoverPrimitive.Arrow className={styles.Arrow} />
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export default function PopupTransformOrigin() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p>Popovers should emanate from the anchor's center or arrow tip.</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Popover side="top" />
        <Popover side="right" />
        <Popover side="bottom" />
        <Popover side="left" />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <PopoverWithArrow side="top" />
        <PopoverWithArrow side="right" />
        <PopoverWithArrow side="bottom" />
        <PopoverWithArrow side="left" />
      </div>
    </div>
  );
}
