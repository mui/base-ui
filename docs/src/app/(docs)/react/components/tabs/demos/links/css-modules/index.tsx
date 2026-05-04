import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';
import styles from './index.module.css';

export default function ExampleTabsLinks() {
  return (
    <Tabs.Root className={styles.Tabs} defaultValue="overview">
      <Tabs.List className={styles.List}>
        <Tabs.LinkTab className={styles.LinkTab} href="#overview" value="overview">
          Overview
        </Tabs.LinkTab>
        <Tabs.LinkTab className={styles.LinkTab} href="#projects" value="projects">
          Projects
        </Tabs.LinkTab>
        <Tabs.LinkTab className={styles.LinkTab} href="#account" value="account">
          Account
        </Tabs.LinkTab>
        <Tabs.Indicator className={styles.Indicator} />
      </Tabs.List>
      <Tabs.Panel className={styles.Panel} value="overview">
        <p className={styles.PanelText}>Review the latest activity and key project updates.</p>
      </Tabs.Panel>
      <Tabs.Panel className={styles.Panel} value="projects">
        <p className={styles.PanelText}>Track milestones, assignments, and project health.</p>
      </Tabs.Panel>
      <Tabs.Panel className={styles.Panel} value="account">
        <p className={styles.PanelText}>Manage profile details, permissions, and preferences.</p>
      </Tabs.Panel>
    </Tabs.Root>
  );
}
