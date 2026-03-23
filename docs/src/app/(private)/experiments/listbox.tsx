'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './listbox.module.css';

const fruits = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape'];

export default function ListboxExperiment() {
  const [singleValue, setSingleValue] = React.useState<string[]>(['Cherry']);
  const [multiValue, setMultiValue] = React.useState<string[]>(['Apple', 'Grape']);

  return (
    <div style={{ display: 'flex', gap: 40, padding: 40 }}>
      <div>
        <h3>Single Selection</h3>
        <Listbox.Root
          value={singleValue}
          onValueChange={(value) => setSingleValue(value)}
        >
          <Listbox.Label className={styles.Label}>Choose a fruit</Listbox.Label>
          <Listbox.List className={styles.List}>
            {fruits.map((fruit) => (
              <Listbox.Item key={fruit} value={fruit} className={styles.Item}>
                <Listbox.ItemIndicator className={styles.Indicator}>
                  ✓
                </Listbox.ItemIndicator>
                <Listbox.ItemText>{fruit}</Listbox.ItemText>
              </Listbox.Item>
            ))}
          </Listbox.List>
        </Listbox.Root>
        <p>Selected: {singleValue[0] ?? 'none'}</p>
      </div>

      <div>
        <h3>Multiple Selection (Shift+Click for range)</h3>
        <Listbox.Root
          selectionMode="multiple"
          value={multiValue}
          onValueChange={(value) => setMultiValue(value)}
        >
          <Listbox.Label className={styles.Label}>Choose fruits</Listbox.Label>
          <Listbox.List className={styles.List}>
            <Listbox.Group>
              <Listbox.GroupLabel className={styles.GroupLabel}>
                Tropical
              </Listbox.GroupLabel>
              {['Banana', 'Date', 'Fig'].map((fruit) => (
                <Listbox.Item key={fruit} value={fruit} className={styles.Item}>
                  <Listbox.ItemIndicator className={styles.Indicator}>
                    ✓
                  </Listbox.ItemIndicator>
                  <Listbox.ItemText>{fruit}</Listbox.ItemText>
                </Listbox.Item>
              ))}
            </Listbox.Group>
            <Listbox.Group>
              <Listbox.GroupLabel className={styles.GroupLabel}>
                Temperate
              </Listbox.GroupLabel>
              {['Apple', 'Cherry', 'Elderberry', 'Grape'].map((fruit) => (
                <Listbox.Item key={fruit} value={fruit} className={styles.Item}>
                  <Listbox.ItemIndicator className={styles.Indicator}>
                    ✓
                  </Listbox.ItemIndicator>
                  <Listbox.ItemText>{fruit}</Listbox.ItemText>
                </Listbox.Item>
              ))}
            </Listbox.Group>
          </Listbox.List>
        </Listbox.Root>
        <p>Selected: {multiValue.join(', ') || 'none'}</p>
      </div>
    </div>
  );
}
