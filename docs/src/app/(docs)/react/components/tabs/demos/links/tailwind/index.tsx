'use client';
import * as React from 'react';
import { Link, MemoryRouter, useLocation } from 'react-router';
import { Tabs } from '@base-ui/react/tabs';

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

const linkTabClassName = `
  flex h-8 items-center justify-center px-2
  text-sm font-normal break-keep whitespace-nowrap text-gray-600 no-underline
  outline-hidden select-none
  before:inset-x-0 before:inset-y-1 before:rounded-xs
  before:-outline-offset-1 before:outline-blue-800
  hover:text-gray-900 data-[active]:text-gray-900
  focus-visible:relative focus-visible:before:absolute
  focus-visible:before:outline focus-visible:before:outline-2
`;

const indicatorClassName = `
  absolute top-1/2 left-0 z-[-1]
  h-6 w-[var(--active-tab-width)] rounded-xs bg-gray-100
  translate-x-[var(--active-tab-left)] -translate-y-1/2
  transition-all duration-200 ease-in-out
`;

const panelClassName = `
  relative flex min-h-32 items-center p-6
  -outline-offset-1 outline-blue-800
  focus-visible:rounded-md focus-visible:outline-2
`;

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
    <Tabs.Root className="rounded-md border border-gray-200" value={activeRoute.path}>
      <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2 text-xs text-gray-500">
        <span>Current route</span>
        <code className="rounded-sm bg-gray-100 px-1 py-0.5 font-mono text-xs leading-4 text-gray-900">
          {location.pathname}
        </code>
      </div>
      <Tabs.List className="relative z-0 flex gap-1 px-1 shadow-[inset_0_-1px] shadow-gray-200">
        {routes.map((route) => (
          <Tabs.LinkTab
            key={route.path}
            className={linkTabClassName}
            render={<Link to={route.path} />}
            value={route.path}
          >
            {route.label}
          </Tabs.LinkTab>
        ))}
        <Tabs.Indicator className={indicatorClassName} />
      </Tabs.List>
      {routes.map((route) => (
        <Tabs.Panel key={route.path} className={panelClassName} value={route.path}>
          <p className="m-0 max-w-80 text-[0.9375rem] leading-6 text-gray-700">
            {route.description}
          </p>
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
