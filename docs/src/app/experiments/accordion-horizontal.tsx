'use client';
import * as React from 'react';
import { DirectionProvider } from '@base-ui-components/react/direction-provider';
import { Accordion } from '@base-ui-components/react/accordion';
import classes from './accordion.horizontal.module.css';

function classNames(...c: Array<string | undefined | null | false>) {
  return c.filter(Boolean).join(' ');
}

export default function App() {
  const [val, setVal] = React.useState(['one']);
  return (
    <div className={classes.wrapper}>
      <h2>Horizontal LTR</h2>
      <Accordion.Root
        className={classes.root}
        aria-label="Uncontrolled Horizontal Accordion"
        openMultiple={false}
      >
        {['one', 'two', 'three'].map((value, index) => (
          <Accordion.Item className={classes.item} key={value}>
            <Accordion.Header className={classes.header}>
              <Accordion.Trigger
                className={classNames(classes.trigger, classes[value])}
              >
                <span className={classes.triggerText}>{index + 1}</span>
                <span className={classes.triggerLabel}>{value}</span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className={classes.panel}>
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
          className={classes.root}
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
            <Accordion.Item className={classes.item} key={value} value={value}>
              <Accordion.Header className={classes.header}>
                <Accordion.Trigger
                  className={classNames(classes.trigger, classes[value])}
                >
                  <span className={classes.triggerText}>{index + 1}</span>
                  <span className={classes.triggerLabel}>{value}</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className={classes.panel}>
                This is the contents of Accordion.Panel {index + 1}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </DirectionProvider>
    </div>
  );
}
