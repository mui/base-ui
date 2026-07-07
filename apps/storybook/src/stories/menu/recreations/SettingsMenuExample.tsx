import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import styles from '../menu.module.css';
import { CaretDownIcon, CheckIcon } from '../icons';

/**
 * Recreation of an editor settings menu that stays open while toggling:
 * checkbox items for frame visibility, a radio group for the theme (both keep
 * the menu open — `closeOnClick` defaults to `false`), and
 * `onOpenChangeComplete` to run cleanup only after the exit animation.
 * Recomposed from seek-oss/playroom `Menu.tsx` (MIT, code-ok,
 * research/d-real-world-usage/menu/ranked.json #3).
 */

const settingsFrames = ['Desktop', 'Tablet', 'Phone'];

export function SettingsMenuExample() {
  const [frames, setFrames] = React.useState<Record<string, boolean>>({
    Desktop: true,
    Tablet: false,
    Phone: true,
  });
  const [theme, setTheme] = React.useState('system');
  const [phase, setPhase] = React.useState('idle');
  const visibleCount = Object.values(frames).filter(Boolean).length;
  return (
    <div className={styles.Stack}>
      <Menu.Root onOpenChangeComplete={(open) => setPhase(open ? 'open settled' : 'close settled')}>
        <Menu.Trigger className={styles.Button}>
          Settings <CaretDownIcon />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={styles.Positioner} sideOffset={8}>
            <Menu.Popup className={styles.Popup}>
              <Menu.Group>
                <Menu.GroupLabel className={styles.GroupLabel}>Visible frames</Menu.GroupLabel>
                {settingsFrames.map((frame) => (
                  <Menu.CheckboxItem
                    key={frame}
                    checked={frames[frame]}
                    onCheckedChange={(checked) =>
                      setFrames((previous) => ({ ...previous, [frame]: checked }))
                    }
                    className={styles.CheckboxItem}
                  >
                    <Menu.CheckboxItemIndicator className={styles.CheckboxItemIndicator}>
                      <CheckIcon />
                    </Menu.CheckboxItemIndicator>
                    <span className={styles.CheckboxItemText}>{frame}</span>
                  </Menu.CheckboxItem>
                ))}
              </Menu.Group>
              <Menu.Separator className={styles.Separator} />
              <Menu.RadioGroup value={theme} onValueChange={setTheme}>
                <Menu.GroupLabel className={styles.GroupLabel}>Editor theme</Menu.GroupLabel>
                {['system', 'light', 'dark'].map((option) => (
                  <Menu.RadioItem key={option} className={styles.RadioItem} value={option}>
                    <Menu.RadioItemIndicator className={styles.RadioItemIndicator}>
                      <CheckIcon />
                    </Menu.RadioItemIndicator>
                    <span className={styles.RadioItemText}>
                      {option[0].toUpperCase() + option.slice(1)}
                    </span>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <output className={styles.Output}>
        {visibleCount} frames visible · theme: {theme} · {phase}
      </output>
    </div>
  );
}
