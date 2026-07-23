import { Tabs } from '@base-ui/react/tabs';

export default function ExampleAnimatedTabs() {
  return (
    <Tabs.Root className="w-full max-w-xs" defaultValue="overview">
      <Tabs.List className="relative z-1 -mb-px flex gap-1">
        <Tabs.Tab className={tabClassName} value="overview">
          Overview
        </Tabs.Tab>
        <Tabs.Tab className={tabClassName} value="projects">
          Projects
        </Tabs.Tab>
        <Tabs.Tab className={tabClassName} value="account">
          Account
        </Tabs.Tab>
        <Tabs.Indicator className="absolute top-0 left-0 -z-1 h-full w-(--active-tab-width) translate-x-(--active-tab-left) border-x border-t border-neutral-950 bg-white transition-[translate,width] duration-150 ease-in-out dark:border-white dark:bg-neutral-950" />
      </Tabs.List>
      <div className="relative grid min-h-32 w-full grid-cols-1 overflow-hidden border border-neutral-950 bg-white dark:border-white dark:bg-neutral-950">
        <Tabs.Panel className={panelClassName} value="overview">
          <p>Workspace stats and activity.</p>
        </Tabs.Panel>
        <Tabs.Panel className={panelClassName} value="projects">
          <p>Milestones and deadlines.</p>
        </Tabs.Panel>
        <Tabs.Panel className={panelClassName} value="account">
          <p>Profile and preferences.</p>
        </Tabs.Panel>
      </div>
    </Tabs.Root>
  );
}

const tabClassName =
  'flex h-[calc(2rem+1px)] items-center justify-center bg-transparent px-2 py-0 font-inherit text-sm font-normal leading-5 break-keep whitespace-nowrap text-neutral-600 outline-none select-none hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white data-active:text-neutral-950 dark:text-neutral-300 dark:hover:text-white dark:data-active:text-white';

const panelClassName =
  'col-start-1 row-start-1 flex w-full items-center justify-center p-4 text-center text-sm text-neutral-950 outline-none focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white dark:text-white ' +
  'transition-[opacity,transform] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'data-starting-style:opacity-0 data-ending-style:opacity-0 ' +
  'data-starting-style:data-[activation-direction=left]:translate-x-[-50%] ' +
  'data-starting-style:data-[activation-direction=right]:translate-x-[50%] ' +
  'data-ending-style:data-[activation-direction=left]:translate-x-[50%] ' +
  'data-ending-style:data-[activation-direction=right]:translate-x-[-50%]';
