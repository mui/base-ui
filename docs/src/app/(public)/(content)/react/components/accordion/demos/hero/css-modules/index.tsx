import * as React from 'react';
import { Accordion } from '@base-ui/react/accordion';
import styles from '../../_index.module.css';

export default function ExampleAccordion() {
  return (
    <Accordion.Root className={styles.Accordion}>
      <Accordion.Item className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            What is Base UI?
            <PlusIcon className={styles.TriggerIcon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>
            Base UI is a library of high-quality unstyled React components for design systems and
            web apps.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            How do I get started?
            <PlusIcon className={styles.TriggerIcon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>
            Head to the “Quick start” guide in the docs. If you’ve used unstyled libraries before,
            you’ll feel at home.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            Can I use it for my project?
            <PlusIcon className={styles.TriggerIcon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>Of course! Base UI is free and open source.</div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentcolor" {...props}>
      <path d="M6.75 0H5.25V5.25H0V6.75L5.25 6.75V12H6.75V6.75L12 6.75V5.25H6.75V0Z" />
    </svg>
  );
}
