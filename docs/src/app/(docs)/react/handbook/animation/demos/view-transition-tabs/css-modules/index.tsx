'use client';
import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';
import styles from './index.module.css';
import './index.css';

const tabs = [
  { value: 'overview', label: 'Overview', description: 'Workspace stats and activity.' },
  { value: 'projects', label: 'Projects', description: 'Milestones and deadlines.' },
  { value: 'account', label: 'Account', description: 'Profile and preferences.' },
];

export default function ViewTransitionTabs() {
  const [value, setValue] = React.useState('overview');

  return (
    <Tabs.Root
      className={styles.Root}
      value={value}
      onValueChange={(nextValue, eventDetails) => {
        React.startTransition(() => {
          React.addTransitionType(eventDetails.activationDirection);
          setValue(nextValue);
        });
      }}
    >
      <Tabs.List className={styles.List}>
        {tabs.map((tab) => (
          <Tabs.Tab key={tab.value} className={styles.Tab} value={tab.value}>
            {tab.label}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator className={styles.Indicator} />
      </Tabs.List>
      <div className={styles.PanelViewport}>
        {tabs.map(
          (tab) =>
            tab.value === value && (
              <React.ViewTransition
                key={tab.value}
                enter={{ right: 'slide-from-right', left: 'slide-from-left', default: 'auto' }}
                exit={{ right: 'slide-to-left', left: 'slide-to-right', default: 'auto' }}
              >
                <Tabs.Panel className={styles.Panel} value={tab.value}>
                  <p className={styles.Paragraph}>{tab.description}</p>
                </Tabs.Panel>
              </React.ViewTransition>
            ),
        )}
      </div>
    </Tabs.Root>
  );
}
