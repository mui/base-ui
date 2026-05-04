'use client';
import * as React from 'react';
import { HashRouter, Link, Navigate, useLocation } from 'react-router';
import { Tabs } from '@base-ui/react/tabs';
import '../../../../demo-data/theme/css-modules/theme.css';
import classes from './react-router-link-tabs.module.css';

const routes = [
  {
    path: '/overview',
    label: 'Overview',
    title: 'Overview route',
    description: 'This tab is selected because the URL fragment resolves to /overview.',
  },
  {
    path: '/projects',
    label: 'Projects',
    title: 'Projects route',
    description:
      'Clicking this link tab navigates with React Router and updates the selected value.',
  },
  {
    path: '/account',
    label: 'Account',
    title: 'Account route',
    description: 'The tab renders as a React Router Link while keeping Base UI tab semantics.',
  },
] as const;

export default function ReactRouterLinkTabsExperiment() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <HashRouter>
      <RoutedTabs />
    </HashRouter>
  );
}

function RoutedTabs() {
  const location = useLocation();
  const activeRoute = routes.find((route) => route.path === location.pathname);

  if (!activeRoute) {
    return <Navigate to={routes[0].path} replace />;
  }

  return (
    <section className={classes.root}>
      <div className={classes.header}>
        <h1 className={classes.title}>React Router link tabs</h1>
        <p className={classes.description}>
          Each tab is a <code>Tabs.LinkTab</code> rendered as a React Router <code>Link</code>.
        </p>
      </div>

      <Tabs.Root className={classes.tabs} value={activeRoute.path}>
        <div className={classes.locationBar}>
          <span className={classes.locationLabel}>Current fragment</span>
          <code className={classes.locationValue}>#{location.pathname}</code>
        </div>

        <Tabs.List className={classes.list} activateOnFocus={false}>
          {routes.map((route) => (
            <Tabs.LinkTab
              key={route.path}
              className={classes.linkTab}
              render={<Link to={route.path} />}
              value={route.path}
            >
              {route.label}
            </Tabs.LinkTab>
          ))}
          <Tabs.Indicator className={classes.indicator} />
        </Tabs.List>

        {routes.map((route) => (
          <Tabs.Panel key={route.path} className={classes.panel} value={route.path}>
            <div className={classes.panelContent}>
              <p className={classes.kicker}>{route.path}</p>
              <h2 className={classes.panelTitle}>{route.title}</h2>
              <p className={classes.panelDescription}>{route.description}</p>
            </div>
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </section>
  );
}
