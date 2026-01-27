'use client';
import * as React from 'react';
import clsx from 'clsx';
import { Tabs } from '@base-ui/react/tabs';
import {
  SettingsMetadata,
  useExperimentSettings,
} from '../../../components/Experiments/SettingsPanel';
import '../../../demo-theme.css';
import baseClasses from './tabs.module.css';
import classes from './tabs-animations.module.css';

const PANELS = [
  {
    label: 'Overview',
    description: 'High-level status, usage highlights, and recent changes.',
  },
  {
    label: 'Activity',
    description: 'Latest events with filters for audits and system updates.',
  },
  {
    label: 'Team',
    description: 'Invite collaborators, manage roles, and review access.',
  },
  {
    label: 'Security',
    description: 'Tokens, sessions, and authentication preferences.',
  },
];

interface Settings {
  orientation: 'horizontal' | 'vertical';
  duration: number;
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  orientation: {
    type: 'string',
    label: 'Orientation',
    options: ['horizontal', 'vertical'],
    default: 'horizontal',
  },
  duration: {
    type: 'number',
    label: 'Duration (ms)',
    default: 220,
  },
};

function ExampleTabs({
  keepMounted,
  orientation,
  duration,
}: {
  keepMounted: boolean;
  orientation: Settings['orientation'];
  duration: number;
}) {
  return (
    <Tabs.Root
      className={clsx(baseClasses.tabs, classes.tabsRoot)}
      defaultValue={0}
      orientation={orientation}
      style={{ '--panel-duration': `${duration}ms` } as React.CSSProperties}
    >
      <Tabs.List className={baseClasses.list} activateOnFocus>
        {PANELS.map((panel, index) => (
          <Tabs.Tab className={baseClasses.tab} key={panel.label} value={index}>
            {panel.label}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator className={baseClasses.indicator} />
      </Tabs.List>
      <div className={classes.panelViewport}>
        {PANELS.map((panel, index) => (
          <Tabs.Panel
            className={classes.panel}
            keepMounted={keepMounted}
            key={panel.label}
            value={index}
          >
            <div className={classes.panelContent}>
              <h3 className={classes.panelTitle}>{panel.label}</h3>
              <p className={classes.panelText}>{panel.description}</p>
            </div>
          </Tabs.Panel>
        ))}
      </div>
    </Tabs.Root>
  );
}

export default function TabsAnimationsExperiment() {
  const { settings } = useExperimentSettings<Settings>();

  return (
    <section className={classes.experiment}>
      <div>
        <h1>Tabs panel transitions</h1>
        <p className={classes.description}>
          Switch tabs to verify the enter/exit animations using data-starting-style and
          data-ending-style. Try arrow keys to see direction-aware movement.
        </p>
      </div>

      <div className={classes.grid}>
        <div className={classes.wrapper}>
          <pre>keepMounted: true</pre>
          <ExampleTabs
            keepMounted
            orientation={settings.orientation}
            duration={settings.duration}
          />
        </div>
        <div className={classes.wrapper}>
          <pre>keepMounted: false</pre>
          <ExampleTabs
            keepMounted={false}
            orientation={settings.orientation}
            duration={settings.duration}
          />
        </div>
      </div>
    </section>
  );
}
