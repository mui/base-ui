import * as React from 'react';
import { Select } from '@base-ui/react/select';
import { Field } from '@base-ui/react/field';
import styles from './index.module.css';

export default function ExampleSelectGrouped() {
  return (
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label} nativeLabel={false} render={<div />}>
        Produce
      </Field.Label>
      <Select.Root items={groupedProduce}>
        <Select.Trigger className={styles.Select}>
          <Select.Value className={styles.Value} placeholder="Select produce" />
          <Select.Icon className={styles.SelectIcon}>
            <ChevronUpDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className={styles.Positioner} sideOffset={8}>
            <Select.Popup className={styles.Popup}>
              <Select.ScrollUpArrow className={styles.ScrollArrow} />
              <Select.List className={styles.List}>
                {groupedProduce.map((group, index) => (
                  <React.Fragment key={group.value}>
                    <Select.Group className={styles.Group}>
                      <Select.GroupLabel className={styles.GroupLabel}>
                        {group.value}
                      </Select.GroupLabel>
                      {group.items.map((item) => (
                        <Select.Item key={item.value} value={item.value} className={styles.Item}>
                          <Select.ItemIndicator className={styles.ItemIndicator}>
                            <CheckIcon className={styles.ItemIndicatorIcon} />
                          </Select.ItemIndicator>
                          <Select.ItemText className={styles.ItemText}>
                            {item.label}
                          </Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Group>
                    {index < groupedProduce.length - 1 ? (
                      <Select.Separator className={styles.Separator} />
                    ) : null}
                  </React.Fragment>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className={styles.ScrollArrow} />
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </Field.Root>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

const groupedProduce = [
  {
    value: 'Fruits',
    items: [
      { value: 'apple', label: 'Apple' },
      { value: 'banana', label: 'Banana' },
      { value: 'mango', label: 'Mango' },
      { value: 'kiwi', label: 'Kiwi' },
      { value: 'grape', label: 'Grape' },
      { value: 'orange', label: 'Orange' },
      { value: 'strawberry', label: 'Strawberry' },
      { value: 'watermelon', label: 'Watermelon' },
    ],
  },
  {
    value: 'Vegetables',
    items: [
      { value: 'broccoli', label: 'Broccoli' },
      { value: 'carrot', label: 'Carrot' },
      { value: 'cauliflower', label: 'Cauliflower' },
      { value: 'cucumber', label: 'Cucumber' },
      { value: 'kale', label: 'Kale' },
      { value: 'pepper', label: 'Bell pepper' },
      { value: 'spinach', label: 'Spinach' },
      { value: 'zucchini', label: 'Zucchini' },
    ],
  },
];
