'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import { ScrollArea } from '@base-ui/react/scroll-area';
import styles from './listbox.module.css';

const countries = [
  'Argentina',
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Canada',
  'Chile',
  'China',
  'Colombia',
  'Czech Republic',
  'Denmark',
  'Egypt',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Ireland',
  'Israel',
  'Italy',
  'Japan',
  'Mexico',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Peru',
  'Poland',
  'Portugal',
  'Romania',
  'Singapore',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'Thailand',
  'Turkey',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Vietnam',
];

export default function ScrollAreaListbox() {
  return (
    <div className={styles.Wrapper}>
      <div className={styles.Section}>
        <span className={styles.SectionTitle}>Listbox with ScrollArea</span>
        <div className={styles.Field}>
          <Listbox.Root defaultValue="France">
            <Listbox.Label className={styles.Label}>Country</Listbox.Label>
            <ScrollArea.Root className={styles.ScrollAreaRoot}>
              <ScrollArea.Viewport className={styles.ScrollAreaViewport}>
                <Listbox.List className={styles.ScrollAreaList}>
                  {countries.map((country) => (
                    <Listbox.Item key={country} value={country} className={styles.Item}>
                      <Listbox.ItemIndicator className={styles.ItemIndicator}>
                        <CheckIcon className={styles.ItemIndicatorIcon} />
                      </Listbox.ItemIndicator>
                      <Listbox.ItemText className={styles.ItemText}>{country}</Listbox.ItemText>
                    </Listbox.Item>
                  ))}
                </Listbox.List>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className={styles.Scrollbar} orientation="vertical">
                <ScrollArea.Thumb className={styles.ScrollbarThumb} />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </Listbox.Root>
        </div>
      </div>
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
