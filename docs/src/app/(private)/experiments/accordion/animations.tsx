'use client';
import * as React from 'react';
import { Accordion } from '@base-ui/react/accordion';
import styles from './animations.module.css';
import { SettingsMetadata, useExperimentSettings } from '../_components/SettingsPanel';

interface Settings extends Record<string, boolean> {}

export const settingsMetadata: SettingsMetadata<Settings> = {
  multiple: {
    type: 'boolean',
    label: 'Allow multiple open',
    default: true,
  },
};

// the `value` prop is set manually on Accordion.Items to ensure animations are
// cancelled when they are initially open
function ExampleAccordion({ keepMounted, multiple }: { keepMounted: boolean; multiple: boolean }) {
  return (
    <Accordion.Root className={styles.Accordion} defaultValue={[0]} multiple={multiple}>
      <Accordion.Item className={styles.Item} value={0}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            What is Base UI?
            <PlusIcon className={styles.TriggerIcon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel} keepMounted={keepMounted}>
          <div className={styles.Content}>
            Base UI is a library of high-quality unstyled React components for design systems and
            web apps.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className={styles.Item} value={1}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            How do I get started?
            <PlusIcon className={styles.TriggerIcon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel} keepMounted={keepMounted}>
          <div className={styles.Content}>
            Head to the “Quick start” guide in the docs. If you’ve used unstyled libraries before,
            you’ll feel at home.
          </div>
        </Accordion.Panel>
      </Accordion.Item>

      <Accordion.Item className={styles.Item} value={2}>
        <Accordion.Header className={styles.Header}>
          <Accordion.Trigger className={styles.Trigger}>
            Can I use it for my project?
            <PlusIcon className={styles.TriggerIcon} />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={styles.Panel} keepMounted={keepMounted}>
          <div className={styles.Content}>Of course! Base UI is free and open source.</div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}

export default function CssAnimations() {
  const { settings } = useExperimentSettings<Settings>();
  const multiple = settings.multiple;
  return (
    <div className={styles.grid}>
      <div className={styles.wrapper}>
        <pre>keepMounted: true</pre>
        <ExampleAccordion keepMounted multiple={multiple} />
        <small>———</small>
      </div>

      <div className={styles.wrapper}>
        <pre>keepMounted: false</pre>
        <ExampleAccordion keepMounted={false} multiple={multiple} />
        <small>———</small>
      </div>
    </div>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentcolor" {...props}>
      <path d="M6.75 0H5.25V5.25H0V6.75L5.25 6.75V12H6.75V6.75L12 6.75V5.25H6.75V0Z" />
    </svg>
  );
}
