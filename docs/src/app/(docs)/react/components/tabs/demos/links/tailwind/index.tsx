import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';

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
    <Tabs.Root className="rounded-md border border-gray-200" defaultValue="overview">
      <Tabs.List className="relative z-0 flex gap-1 px-1 shadow-[inset_0_-1px] shadow-gray-200">
        <Tabs.LinkTab className={linkTabClassName} href="#overview" value="overview">
          Overview
        </Tabs.LinkTab>
        <Tabs.LinkTab className={linkTabClassName} href="#projects" value="projects">
          Projects
        </Tabs.LinkTab>
        <Tabs.LinkTab className={linkTabClassName} href="#account" value="account">
          Account
        </Tabs.LinkTab>
        <Tabs.Indicator className={indicatorClassName} />
      </Tabs.List>
      <Tabs.Panel className={panelClassName} value="overview">
        <p className="m-0 max-w-80 text-[0.9375rem] leading-6 text-gray-700">
          Review the latest activity and key project updates.
        </p>
      </Tabs.Panel>
      <Tabs.Panel className={panelClassName} value="projects">
        <p className="m-0 max-w-80 text-[0.9375rem] leading-6 text-gray-700">
          Track milestones, assignments, and project health.
        </p>
      </Tabs.Panel>
      <Tabs.Panel className={panelClassName} value="account">
        <p className="m-0 max-w-80 text-[0.9375rem] leading-6 text-gray-700">
          Manage profile details, permissions, and preferences.
        </p>
      </Tabs.Panel>
    </Tabs.Root>
  );
}
