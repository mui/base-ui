import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import styles from '../../index.module.css';
import { ArrowSvg, BellIcon } from '../../icons';

const demoPopover = Popover.createHandle();

export default function PopoverDetachedTriggersSimpleDemo() {
  return (
    <React.Fragment>
      <Popover.Trigger className={styles.IconButton} handle={demoPopover}>
        <BellIcon aria-label="Notifications" className={styles.Icon} />
      </Popover.Trigger>

      <Popover.Root handle={demoPopover}>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className={styles.Popup}>
              <Popover.Arrow className={styles.Arrow}>
                <ArrowSvg />
              </Popover.Arrow>
              <Popover.Title className={styles.Title}>Notifications</Popover.Title>
              <Popover.Description className={styles.Description}>
                You are all caught up. Good job!
              </Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </React.Fragment>
  );
}
