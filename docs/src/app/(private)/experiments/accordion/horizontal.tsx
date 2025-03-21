'use client';
import * as React from 'react';
import { DirectionProvider } from '@base-ui-components/react/direction-provider';
import { Accordion } from '@base-ui-components/react/accordion';
import styles from './horizontal.module.css';

function classNames(...c: Array<string | undefined | null | false>) {
  return c.filter(Boolean).join(' ');
}

export default function App() {
  const [val, setVal] = React.useState(['one']);
  return (
    <div className={styles.wrapper}>
      <h2>Horizontal LTR</h2>
      <Accordion.Root
        className={styles.root}
        aria-label="Uncontrolled Horizontal Accordion"
        openMultiple={false}
      >
        {['one', 'two', 'three'].map((value, index) => (
          <Accordion.Item className={styles.item} key={value}>
            <Accordion.Header className={styles.header}>
              <Accordion.Trigger
                className={classNames(styles.trigger, styles[value])}
              >
                <span className={styles.triggerText}>{index + 1}</span>
                <span className={styles.triggerLabel}>{value}</span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className={styles.panel}>
              This is the contents of Accordion.Panel {index + 1}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      <span>
        <h2>Horizontal RTL</h2>
        <p>one section must remain open</p>
      </span>
      <DirectionProvider direction="rtl">
        <Accordion.Root
          className={styles.root}
          aria-label="Controlled Horizontal RTL Accordion"
          openMultiple={false}
          orientation="horizontal"
          value={val}
          onValueChange={(newValue: Accordion.Root.Props['value']) => {
            if (Array.isArray(newValue) && newValue.length > 0) {
              setVal(newValue);
            }
          }}
        >
          {['one', 'two', 'three'].map((value, index) => (
            <Accordion.Item className={styles.item} key={value} value={value}>
              <Accordion.Header className={styles.header}>
                <Accordion.Trigger
                  className={classNames(styles.trigger, styles[value])}
                >
                  <span className={styles.triggerText}>{index + 1}</span>
                  <span className={styles.triggerLabel}>{value}</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className={styles.panel}>
                This is the contents of Accordion.Panel {index + 1}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </DirectionProvider>
    </div>
  );
}
