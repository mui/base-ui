import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './index.module.css';

const fontGroups = [
  {
    label: 'Sans-serif',
    fonts: [
      { label: 'Die Grotesk', value: 'die-grotesk' },
      { label: 'Roboto', value: 'roboto' },
      { label: 'Open Sans', value: 'open-sans' },
      { label: 'Montserrat', value: 'montserrat' },
    ],
  },
  {
    label: 'Monospace',
    fonts: [
      { label: 'JetBrains Mono', value: 'jetbrains-mono' },
      { label: 'Fira Code', value: 'fira-code' },
      { label: 'Source Code Pro', value: 'source-code-pro' },
      { label: 'IBM Plex Mono', value: 'ibm-plex-mono' },
    ],
  },
];

export default function ExampleListbox() {
  return (
    <div className={styles.Field}>
      <Listbox.Root defaultValue={['die-grotesk']}>
        <Listbox.Label className={styles.Label}>Font family</Listbox.Label>
        <Listbox.List className={styles.List}>
          {fontGroups.map((group) => (
            <Listbox.Group key={group.label} className={styles.Group}>
              <Listbox.GroupLabel className={styles.GroupLabel}>{group.label}</Listbox.GroupLabel>
              {group.fonts.map(({ label, value }) => (
                <Listbox.Item key={value} value={value} className={styles.Item}>
                  <Listbox.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon className={styles.ItemIndicatorIcon} />
                  </Listbox.ItemIndicator>
                  <Listbox.ItemText className={styles.ItemText}>{label}</Listbox.ItemText>
                </Listbox.Item>
              ))}
            </Listbox.Group>
          ))}
        </Listbox.List>
      </Listbox.Root>
    </div>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
