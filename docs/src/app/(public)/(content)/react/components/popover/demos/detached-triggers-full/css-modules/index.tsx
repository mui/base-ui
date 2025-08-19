import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';
import { ArrowSvg } from '../../icons';
import styles from './index.module.css';

const demoPopover = Popover.createHandle<{ text: string }>();

export default function PopoverDetachedTriggersFullDemo() {
  return (
    <React.Fragment>
      <Popover.Trigger
        className={styles.IconButton}
        handle={demoPopover}
        payload={{ text: 'Trigger 1' }}
      >
        1
      </Popover.Trigger>

      <Popover.Trigger
        className={styles.IconButton}
        handle={demoPopover}
        payload={{ text: 'Trigger 2' }}
      >
        2
      </Popover.Trigger>

      <Popover.Trigger
        className={styles.IconButton}
        handle={demoPopover}
        payload={{ text: 'Trigger 3' }}
      >
        3
      </Popover.Trigger>

      <Popover.Root handle={demoPopover}>
        {({ payload }) => (
          <Popover.Portal>
            <Popover.Positioner sideOffset={8} className={styles.Positioner}>
              <Popover.Popup className={styles.Popup}>
                <Popover.Arrow className={styles.Arrow}>
                  <ArrowSvg />
                </Popover.Arrow>

                <Popover.Viewport className={styles.Viewport}>
                  <Popover.Title className={styles.Title}>Popover</Popover.Title>
                  {payload !== undefined && (
                    <Popover.Description className={styles.Description}>
                      This has been opened by {payload.text}
                    </Popover.Description>
                  )}
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </React.Fragment>
  );
}
