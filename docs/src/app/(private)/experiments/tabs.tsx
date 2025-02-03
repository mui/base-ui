'use client';
/* eslint-disable react/no-danger */
import * as React from 'react';
import clsx from 'clsx';
import { Tabs } from '@base-ui-components/react/tabs';
import classes from './tabs.module.css';
import { SettingsPanel } from './infra/SettingsPanel';

interface Settings {
  orientation: 'horizontal' | 'vertical';
  activateOnFocus: boolean;
  elasticIndicator: boolean;
}

const settingsMetadata = {
  orientation: {
    options: ['horizontal', 'vertical'],
  },
};

export default function TabsExperiment() {
  const [value, setValue] = React.useState<string | number | null>(0);
  const [settings, setSettings] = React.useState<Settings>({
    orientation: 'horizontal',
    activateOnFocus: true,
    elasticIndicator: false,
  });

  return (
    <div>
      <h1>Tabs</h1>
      <Tabs.Root
        className={classes.tabs}
        value={value}
        onValueChange={(val) => setValue(val)}
        orientation={settings.orientation}
      >
        <Tabs.List
          className={classes.list}
          activateOnFocus={settings.activateOnFocus}
        >
          <Tabs.Tab className={classes.tab} value={0}>
            Code
          </Tabs.Tab>
          <Tabs.Tab className={classes.tab} value={1}>
            Issues
          </Tabs.Tab>
          <Tabs.Tab className={classes.tab} value={2}>
            Pull Requests
          </Tabs.Tab>
          <Tabs.Tab className={classes.tab} value={3} disabled>
            Discussions
          </Tabs.Tab>
          <Tabs.Tab className={classes.tab} value={4}>
            Actions
          </Tabs.Tab>
          <Tabs.Indicator
            className={clsx(
              classes.indicator,
              settings.elasticIndicator && classes.elastic,
            )}
          />
        </Tabs.List>
        <Tabs.Panel className={classes.panel} value={0} keepMounted>
          Code panel
        </Tabs.Panel>
        <Tabs.Panel className={classes.panel} value={1} keepMounted>
          Issues panel
        </Tabs.Panel>
        <Tabs.Panel className={classes.panel} value={2} keepMounted>
          Pull Requests panel
        </Tabs.Panel>
        <Tabs.Panel className={classes.panel} value={3} keepMounted>
          Discussions panel
        </Tabs.Panel>
        <Tabs.Panel className={classes.panel} value={4} keepMounted>
          Actions panel
        </Tabs.Panel>
      </Tabs.Root>

      <SettingsPanel
        settings={settings}
        settingsMetadata={settingsMetadata}
        onChange={setSettings}
      />
    </div>
  );
}
