'use client';
import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import demoStyles from 'docs/src/app/(docs)/react/components/popover/demos/detached-triggers-full/css-modules/index.module.css';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';
import styles from './inline.module.css';

interface Settings {
  openOnHover: boolean;
  delay: number;
  closeDelay: number;
  side: 'top' | 'bottom' | 'left' | 'right';
  width: number;
}

export default function InlinePopover() {
  const { settings } = useExperimentSettings<Settings>();

  return (
    <div className={styles.Page}>
      <h1>Inline positioning</h1>
      <p>
        Hover (or click) the highlighted trigger below. Because it is an inline element that wraps
        across multiple lines, the popover anchors to the exact line you interact with rather than
        to the trigger&apos;s full bounding box. Move along the trigger across different lines to
        see the popup follow. Single-line triggers are unaffected.
      </p>

      <div className={styles.Prose} style={{ maxWidth: settings.width }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod{' '}
        <Popover.Root>
          <Popover.Trigger
            className={styles.InlineTrigger}
            nativeButton={false}
            render={<span />}
            openOnHover={settings.openOnHover}
            delay={settings.delay}
            closeDelay={settings.closeDelay}
          >
            tempor incididunt ut labore et dolore magna aliqua, a long inline trigger that wraps
            across several lines
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              sideOffset={8}
              className={demoStyles.Positioner}
              side={settings.side}
            >
              <Popover.Popup className={demoStyles.Popup}>
                <Popover.Viewport className={demoStyles.Viewport}>
                  <Popover.Title className={demoStyles.Title}>Inline popover</Popover.Title>
                  <p>Anchored to the hovered line of the inline trigger.</p>
                </Popover.Viewport>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>{' '}
        ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </div>
    </div>
  );
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  openOnHover: {
    type: 'boolean',
    label: 'Open on hover',
    default: true,
  },
  delay: {
    type: 'number',
    label: 'Delay',
    default: 200,
  },
  closeDelay: {
    type: 'number',
    label: 'Close Delay',
    default: 0,
  },
  side: {
    type: 'string',
    label: 'Side',
    options: ['top', 'bottom', 'left', 'right'],
    default: 'bottom',
  },
  width: {
    type: 'number',
    label: 'Container width',
    default: 320,
  },
};
