import * as React from 'react';
import { Accordion } from '@base-ui/react/accordion';
import styles from '../../_index.module.css';

export default function ExampleAccordion() {
  return (
    <Accordion.Root className={styles.Accordion} hiddenUntilFound>
      <Accordion.Item className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            How long does shipping take?
            <PlusIcon className={styles.Icon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>
            Standard shipping takes 3–5 business days. Express delivery arrives in 1–2 business
            days.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            What is your return policy?
            <PlusIcon className={styles.Icon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>
            You can return any item within 30 days of delivery. Opened items may be subject to a 10%
            restocking fee.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            Do you ship internationally?
            <PlusIcon className={styles.Icon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>
            Yes, we ship to over 40 countries. International orders typically arrive within 7–14
            business days.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className={styles.Item}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            How can I track my order?
            <PlusIcon className={styles.Icon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel}>
          <div className={styles.Content}>
            Once your order ships, you’ll receive a tracking link by email. Tracking updates can
            take up to 24 hours to appear.
          </div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 8h13M8 14.5v-13" />
    </svg>
  );
}
