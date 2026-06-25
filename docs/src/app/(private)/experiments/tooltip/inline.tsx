'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import demoStyles from 'docs/src/app/(docs)/react/components/tooltip/demos/detached-triggers-full/css-modules/index.module.css';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';
import styles from './inline.module.css';

interface Settings {
  delay: number;
  closeDelay: number;
  side: 'top' | 'bottom' | 'left' | 'right';
  trackCursorAxis: 'none' | 'x' | 'y' | 'both';
  width: number;
}

export default function InlineTooltip() {
  const { settings } = useExperimentSettings<Settings>();

  return (
    <Tooltip.Provider>
      <div className={styles.Page}>
        <h1>Inline positioning</h1>
        <p>
          Hover (or focus) the highlighted trigger below. Because it is an inline element that wraps
          across multiple lines, the tooltip anchors to the exact line you interact with rather than
          to the trigger&apos;s full bounding box. With cursor tracking enabled, inline positioning
          is disabled and the tooltip follows the pointer instead.
        </p>

        <div className={styles.Prose} style={{ maxWidth: settings.width }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod{' '}
          <Tooltip.Root trackCursorAxis={settings.trackCursorAxis}>
            <Tooltip.Trigger
              className={styles.InlineTrigger}
              render={<span />}
              delay={settings.delay}
              closeDelay={settings.closeDelay}
            >
              tempor incididunt ut labore et dolore magna aliqua, a long inline trigger that wraps
              across several lines
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner
                sideOffset={10}
                className={demoStyles.Positioner}
                side={settings.side}
              >
                <Tooltip.Popup className={demoStyles.Popup}>
                  <Tooltip.Viewport className={demoStyles.Viewport}>
                    Anchored to the hovered line of the inline trigger.
                  </Tooltip.Viewport>
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>{' '}
          ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
          commodo consequat.
        </div>
      </div>
    </Tooltip.Provider>
  );
}

export const settingsMetadata: SettingsMetadata<Settings> = {
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
    default: 'top',
  },
  trackCursorAxis: {
    type: 'string',
    label: 'Track cursor axis',
    options: ['none', 'x', 'y', 'both'],
    default: 'none',
  },
  width: {
    type: 'number',
    label: 'Container width',
    default: 320,
  },
};
