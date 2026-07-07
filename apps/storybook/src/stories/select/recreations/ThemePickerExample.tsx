import * as React from 'react';
import { Select } from '@base-ui/react/select';
import styles from '../select.module.css';
import rw from '../select-real-world.module.css';
import { CheckIcon, SunIcon, MoonIcon, MonitorIcon } from '../DemoSelect';

/**
 * Recreation of the graphql.org header theme switcher: an icon-only trigger labeled
 * with `aria-label`, a visually hidden `Select.Value`, and `align="end"` positioning.
 * Recomposed from graphql/graphql.github.io `theme-switch.tsx` (MIT, code-ok,
 * research/d-real-world-usage/select/ranked.json #5).
 */

const pickerThemes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function ThemeIcon({ theme }: { theme: string }) {
  if (theme === 'light') {
    return <SunIcon />;
  }
  if (theme === 'dark') {
    return <MoonIcon />;
  }
  return <MonitorIcon />;
}

export function ThemePickerExample() {
  const [theme, setTheme] = React.useState('system');
  return (
    <div className={styles.Stack}>
      <Select.Root
        items={pickerThemes}
        value={theme}
        // Single-mode onValueChange receives (value | null, eventDetails); there is
        // no null item here, so guard like graphql.org's type-guarded handler.
        onValueChange={(value) => setTheme(value ?? 'system')}
      >
        <Select.Trigger className={rw.IconTrigger} aria-label="Theme">
          <Select.Value className={rw.SrOnly} />
          <ThemeIcon theme={theme} />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            className={styles.Positioner}
            align="end"
            sideOffset={8}
            alignItemWithTrigger={false}
          >
            <Select.Popup className={styles.Popup}>
              <Select.List className={styles.List}>
                {pickerThemes.map(({ value, label }) => (
                  <Select.Item key={value} value={value} className={styles.Item}>
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <div className={rw.ThemeCard} data-theme={theme}>
        Resolved theme: {theme}
      </div>
    </div>
  );
}
