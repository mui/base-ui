'use client';
import * as React from 'react';
import { Listbox } from '@base-ui/react/listbox';
import styles from './listbox.module.css';

const alignOptions = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
  { label: 'Justify', value: 'justify' },
];

const sizes = [
  { label: 'XS', value: 'xs' },
  { label: 'S', value: 's' },
  { label: 'M', value: 'm' },
  { label: 'L', value: 'l' },
  { label: 'XL', value: 'xl' },
  { label: '2XL', value: '2xl' },
  { label: '3XL', value: '3xl' },
];

const initialLayers = [
  { label: 'Background', value: 'background' },
  { label: 'Shapes', value: 'shapes' },
  { label: 'Text', value: 'text' },
  { label: 'Icons', value: 'icons' },
  { label: 'Overlay', value: 'overlay' },
];

export default function HorizontalListbox() {
  const [layers, setLayers] = React.useState(initialLayers);

  return (
    <div className={styles.Wrapper}>
      <div className={styles.Section}>
        <span className={styles.SectionTitle}>Single selection</span>
        <div className={styles.Field}>
          <Listbox.Root orientation="horizontal" defaultValue={["center"]}>
            <Listbox.Label className={styles.Label}>Text alignment</Listbox.Label>
            <Listbox.List className={styles.HorizontalList}>
              {alignOptions.map(({ label, value }) => (
                <Listbox.Item key={value} value={value} className={styles.HorizontalChip}>
                  <Listbox.ItemText>{label}</Listbox.ItemText>
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        </div>
      </div>

      <div className={styles.Section}>
        <span className={styles.SectionTitle}>Multiple selection</span>
        <div className={styles.Field}>
          <Listbox.Root orientation="horizontal" selectionMode="multiple" defaultValue={['m']}>
            <Listbox.Label className={styles.Label}>Available sizes</Listbox.Label>
            <Listbox.List className={styles.HorizontalList}>
              {sizes.map(({ label, value }) => (
                <Listbox.Item key={value} value={value} className={styles.HorizontalChip}>
                  <Listbox.ItemText>{label}</Listbox.ItemText>
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        </div>
      </div>

      <div className={styles.Section}>
        <span className={styles.SectionTitle}>Draggable horizontal</span>
        <div className={styles.Field}>
          <Listbox.Root
            orientation="horizontal"
            defaultValue={["text"]}
            onItemsReorder={(event) => {
              setLayers((prev) => {
                const movedItem = prev.find((item) => item.value === event.items[0])!;
                const next = prev.filter((item) => item.value !== event.items[0]);
                const refIndex = next.findIndex((item) => item.value === event.referenceItem);
                next.splice(event.edge === 'after' ? refIndex + 1 : refIndex, 0, movedItem);
                return next;
              });
            }}
          >
            <Listbox.Label className={styles.Label}>Layer order</Listbox.Label>
            <Listbox.List className={styles.HorizontalList}>
              {layers.map(({ label, value }) => (
                <Listbox.Item
                  key={value}
                  value={value}
                  draggable
                  className={styles.HorizontalChip}
                >
                  <Listbox.ItemText>{label}</Listbox.ItemText>
                </Listbox.Item>
              ))}
            </Listbox.List>
          </Listbox.Root>
        </div>
      </div>
    </div>
  );
}
