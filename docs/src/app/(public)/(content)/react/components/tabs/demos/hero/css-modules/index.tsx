import * as React from 'react';
import { Tabs } from '@base-ui-components/react/tabs';
import styles from './index.module.css';

export default function ExampleTabs() {
  return (
    <Tabs.Root className={styles.Tabs} defaultValue="overview">
      <Tabs.List className={styles.List}>
        <Tabs.Tab className={styles.Tab} value="overview">
          Overview
        </Tabs.Tab>
        <Tabs.Tab className={styles.Tab} value="projects">
          Projects
        </Tabs.Tab>
        <Tabs.Tab className={styles.Tab} value="account">
          Account
        </Tabs.Tab>
        <Tabs.Indicator className={styles.Indicator} />
      </Tabs.List>
      <Tabs.Panel className={styles.Panel} value="overview">
        <OverviewIcon className={styles.Icon} />
      </Tabs.Panel>
      <Tabs.Panel className={styles.Panel} value="projects">
        <ProjectIcon className={styles.Icon} />
      </Tabs.Panel>
      <Tabs.Panel className={styles.Panel} value="account">
        <PersonIcon className={styles.Icon} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}

function OverviewIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="40" height="40" viewBox="0 0 30 30" fill="currentcolor" {...props}>
      <path d="M 6 4 C 4.895 4 4 4.895 4 6 L 4 12 C 4 13.105 4.895 14 6 14 L 12 14 C 13.105 14 14 13.105 14 12 L 14 6 C 14 4.895 13.105 4 12 4 L 6 4 z M 18 4 C 16.895 4 16 4.895 16 6 L 16 12 C 16 13.105 16.895 14 18 14 L 24 14 C 25.105 14 26 13.105 26 12 L 26 6 C 26 4.895 25.105 4 24 4 L 18 4 z M 9 6 C 10.657 6 12 7.343 12 9 C 12 10.657 10.657 12 9 12 C 7.343 12 6 10.657 6 9 C 6 7.343 7.343 6 9 6 z M 18 6 L 24 6 L 24 12 L 18 12 L 18 6 z M 6 16 C 4.895 16 4 16.895 4 18 L 4 24 C 4 25.105 4.895 26 6 26 L 12 26 C 13.105 26 14 25.105 14 24 L 14 18 C 14 16.895 13.105 16 12 16 L 6 16 z M 18 16 C 16.895 16 16 16.895 16 18 L 16 24 C 16 25.105 16.895 26 18 26 L 24 26 C 25.105 26 26 25.105 26 24 L 26 18 C 26 16.895 25.105 16 24 16 L 18 16 z M 21 17.5 L 24.5 21 L 21 24.5 L 17.5 21 L 21 17.5 z M 9 18 L 11.886719 23 L 6.1132812 23 L 9 18 z" />
    </svg>
  );
}

function ProjectIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="40" height="40" viewBox="0 0 30 30" fill="currentcolor" {...props}>
      <path d="M 14.984375 1.9863281 A 1.0001 1.0001 0 0 0 14 3 L 14 4 L 5 4 L 4 4 A 1.0001 1.0001 0 1 0 3.9804688 6 C 3.9348612 9.0608831 3.6893807 11.887023 3.1523438 14.142578 C 2.5565033 16.645108 1.6039585 18.395538 0.4453125 19.167969 A 1.0001 1.0001 0 0 0 1 21 L 4 21 C 4 22.105 4.895 23 6 23 L 11.787109 23 L 10.148438 26.042969 A 1.5 1.5 0 0 0 9 27.5 A 1.5 1.5 0 0 0 10.5 29 A 1.5 1.5 0 0 0 12 27.5 A 1.5 1.5 0 0 0 11.910156 26.992188 L 14.060547 23 L 15.939453 23 L 18.089844 26.992188 A 1.5 1.5 0 0 0 18 27.5 A 1.5 1.5 0 0 0 19.5 29 A 1.5 1.5 0 0 0 21 27.5 A 1.5 1.5 0 0 0 19.851562 26.042969 L 18.212891 23 L 24 23 C 25.105 23 26 22.105 26 21 L 26 6 A 1.0001 1.0001 0 1 0 26 4 L 25 4 L 16 4 L 16 3 A 1.0001 1.0001 0 0 0 14.984375 1.9863281 z M 5.9589844 6 L 14.832031 6 A 1.0001 1.0001 0 0 0 15.158203 6 L 23.958984 6 C 23.912194 9.0500505 23.687726 11.893974 23.152344 14.142578 C 22.583328 16.532444 21.674397 18.178754 20.585938 19 L 3.1523438 19 C 3.9976592 17.786874 4.6791735 16.365049 5.0976562 14.607422 C 5.6877248 12.129135 5.9137751 9.1554725 5.9589844 6 z" />
    </svg>
  );
}

function PersonIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="40" height="40" viewBox="0 0 30 30" fill="currentcolor" {...props}>
      <path d="M15,3C8.373,3,3,8.373,3,15c0,6.627,5.373,12,12,12s12-5.373,12-12C27,8.373,21.627,3,15,3z M8,22.141 c1.167-3.5,4.667-2.134,5.25-4.03v-1.264c-0.262-0.141-1.013-1.109-1.092-1.865c-0.207-0.018-0.531-0.223-0.627-1.034 c-0.051-0.435,0.153-0.68,0.276-0.757c0,0-0.308-0.702-0.308-1.399C11.5,9.72,12.526,8,15,8c1.336,0,1.75,0.947,1.75,0.947 c1.194,0,1.75,1.309,1.75,2.844c0,0.765-0.308,1.399-0.308,1.399c0.124,0.077,0.328,0.322,0.277,0.757 c-0.096,0.811-0.42,1.016-0.627,1.034c-0.079,0.756-0.829,1.724-1.092,1.865v1.264c0.583,1.897,4.083,0.531,5.25,4.031 c0,0-2.618,2.859-7,2.859C10.593,25,8,22.141,8,22.141z" />
    </svg>
  );
}
