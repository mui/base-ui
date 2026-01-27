import * as React from 'react';
import styles from './perf.module.css';

export interface Settings {
  renderDialog: boolean;
  renderMenu: boolean;
  renderPopover: boolean;
  renderTooltip: boolean;
}

export const defaultSettings: Settings = {
  renderDialog: true,
  renderMenu: true,
  renderPopover: true,
  renderTooltip: true,
};

const settingRows: Array<{ key: keyof Settings; label: string }> = [
  { key: 'renderDialog', label: 'Render Dialog' },
  { key: 'renderMenu', label: 'Render Menu' },
  { key: 'renderPopover', label: 'Render Popover' },
  { key: 'renderTooltip', label: 'Render Tooltip' },
];

interface SettingsPanelProps {
  settings: Settings;
  onChange: React.Dispatch<React.SetStateAction<Settings>>;
}

export function SettingsPanel(props: SettingsPanelProps) {
  const { settings, onChange } = props;

  return (
    <fieldset className={styles.settingsPanel}>
      <legend className={styles.settingsLegend}>Settings</legend>
      <div className={styles.settingsGrid}>
        {settingRows.map((row) => (
          <label key={row.key} className={styles.settingsRow}>
            <input
              type="checkbox"
              className={styles.settingsCheckbox}
              checked={settings[row.key]}
              onChange={(event) => {
                const nextChecked = event.currentTarget.checked;
                onChange((prev) => ({
                  ...prev,
                  [row.key]: nextChecked,
                }));
              }}
            />
            <span>{row.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
