'use client';
import * as React from 'react';
import { Link, MemoryRouter, useLocation } from 'react-router';
import { Tabs } from '@base-ui/react/tabs';
import styles from './index.module.css';

const routes = [
  {
    path: '/overview',
    label: 'Overview',
    description: 'Review the latest activity and key project updates.',
  },
  {
    path: '/projects',
    label: 'Projects',
    description: 'Track milestones, assignments, and project health.',
  },
  {
    path: '/account',
    label: 'Account',
    description: 'Manage profile details, permissions, and preferences.',
  },
] as const;

export default function ExampleTabsLinks() {
  return (
    <MemoryRouter initialEntries={[routes[0].path]}>
      <RouterTabs />
    </MemoryRouter>
  );
}

function RouterTabs() {
  const location = useLocation();
  const activeRoute = routes.find((route) => route.path === location.pathname) ?? routes[0];

  return (
    <Tabs.Root className={styles.Tabs} value={activeRoute.path}>
      <div className={styles.Route}>
        <span className={styles.RouteLabel}>Current route</span>
        <code className={styles.RouteValue}>{location.pathname}</code>
      </div>
      <Tabs.List className={styles.List}>
        {routes.map((route) => (
          <Tabs.LinkTab
            key={route.path}
            className={styles.LinkTab}
            render={<Link to={route.path} />}
            value={route.path}
          >
            {route.label}
          </Tabs.LinkTab>
        ))}
        <Tabs.Indicator className={styles.Indicator} />
      </Tabs.List>
      {routes.map((route) => (
        <Tabs.Panel key={route.path} className={styles.Panel} value={route.path}>
          <p className={styles.PanelText}>{route.description}</p>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
