import * as React from 'react';
import { Select } from '@base-ui/react/select';
import styles from '../select.module.css';
import rw from '../select-real-world.module.css';
import { CaretUpDownIcon, CheckIcon } from '../DemoSelect';

/**
 * Recreation of a design-system wrapper: an object-map `items` API with per-item
 * disabled reasons rendered as secondary text. Recomposed from the ideas in
 * cloudflare/kumo `select.tsx` (MIT, code-ok,
 * research/d-real-world-usage/select/ranked.json #1).
 */

type RegistryOptionDescriptor =
  | string
  | { label: string; disabled?: boolean; disabledReason?: string };

/**
 * Registry-style wrapper: `items` given as an object map whose descriptors carry
 * per-item `disabled` + `disabledReason`, resolved into Base UI parts internally.
 */
export function RegistrySelect({
  label,
  placeholder,
  items,
}: {
  label: string;
  placeholder?: string;
  items: Record<string, RegistryOptionDescriptor>;
}) {
  const entries = Object.entries(items).map(([value, descriptor]) =>
    typeof descriptor === 'string'
      ? { value, label: descriptor, disabled: false, disabledReason: undefined }
      : {
          value,
          label: descriptor.label,
          disabled: descriptor.disabled ?? false,
          disabledReason: descriptor.disabledReason,
        },
  );
  const labelMap = Object.fromEntries(entries.map((entry) => [entry.value, entry.label]));
  return (
    <div className={styles.Field}>
      <Select.Root items={labelMap}>
        <Select.Label className={styles.Label}>{label}</Select.Label>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} placeholder={placeholder} />
          <Select.Icon className={styles.Icon}>
            <CaretUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={4}>
            <Select.Popup className={styles.Popup}>
              <Select.List className={styles.List}>
                {entries.map((entry) => (
                  <Select.Item
                    key={entry.value}
                    value={entry.value}
                    disabled={entry.disabled}
                    className={styles.Item}
                  >
                    <Select.ItemIndicator className={styles.ItemIndicator}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                    <Select.ItemText className={styles.ItemText}>
                      {entry.label}
                      {entry.disabledReason ? (
                        <span className={rw.DisabledReason}>{entry.disabledReason}</span>
                      ) : null}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

export function RegistrySelectExample() {
  return (
    <RegistrySelect
      label="Region"
      placeholder="Select region"
      items={{
        'eu-west': 'Frankfurt',
        'us-east': 'Ashburn',
        'ap-southeast': {
          label: 'Singapore',
          disabled: true,
          disabledReason: 'Not available on the free plan',
        },
      }}
    />
  );
}
