'use client';
import * as React from 'react';
import { Button } from '@base-ui/react/button';
import { Tree } from '@base-ui/react/tree';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';

interface Service extends Tree.DefaultItem {
  requests?: number;
  children?: Service[];
}

const REGIONS = ['Europe', 'North America', 'Asia Pacific'];
const SERVICES = ['API', 'Auth', 'Search', 'Payments'];

const items: Service[] = REGIONS.map((region) => ({
  id: region,
  label: region,
  children: SERVICES.map((service, index) => ({
    id: `${region}/${service}`,
    label: service,
    requests: 120 + index * 40,
  })),
}));

const SERVICE_IDS = items.flatMap((region) => region.children!.map((service) => service.id));
const UPDATE_INTERVAL = 50;
const UPDATES_PER_INTERVAL = 6;

const BUTTON_CLASS =
  'flex h-8 items-center justify-center gap-2 rounded-none border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap font-normal text-neutral-950 select-none hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white data-disabled:border-neutral-500 data-disabled:text-neutral-500 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400';

const ITEM_CLASS =
  'flex items-center gap-2 px-2 py-1 select-none text-sm/[1.5] text-neutral-950 ' +
  '[--leaf-offset:0rem] not-data-expandable:[--leaf-offset:3.25rem] ' +
  'hover:bg-neutral-100 ' +
  'data-selected:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-1 ' +
  'focus-visible:outline-neutral-950 dark:text-white dark:hover:bg-neutral-800 ' +
  'dark:data-selected:bg-neutral-700 dark:focus-visible:outline-white ' +
  'border-s-2 border-transparent data-selected:border-neutral-950 dark:data-selected:border-white ' +
  'forced-colors:border-[color:Canvas] forced-colors:data-selected:border-[color:Highlight]';

const CONTROL_CLASS =
  'relative after:absolute after:-inset-0.5 ' +
  'inline-flex size-5 shrink-0 items-center justify-center border-0 bg-transparent p-0 ' +
  'text-neutral-500 focus-visible:outline-2 focus-visible:outline-neutral-950 ' +
  'dark:text-neutral-400 dark:focus-visible:outline-white [&_svg]:size-3';

const HIERARCHY_CLASS =
  'ms-[calc(1.5rem*(var(--tree-item-level)-1))] flex min-w-0 flex-1 items-center gap-2 ' +
  'ps-[var(--leaf-offset)]';

export default function ExampleTreeHighFrequencyUpdates() {
  const actionsRef = React.useRef<Tree.Root.Actions<Service>>(null);
  const updateTimeout = useTimeout();
  const [liveUpdates, setLiveUpdates] = React.useState(false);

  // For demo purposes, change the traffic of random services on an interval.
  const updateTraffic = useStableCallback(() => {
    if (!liveUpdates) {
      return;
    }
    // @highlight-start
    void actionsRef.current?.applyTransaction((transaction) => {
      for (let index = 0; index < UPDATES_PER_INTERVAL; index += 1) {
        const id = SERVICE_IDS[Math.floor(Math.random() * SERVICE_IDS.length)];
        transaction.update(id, { requests: Math.round(50 + Math.random() * 450) });
      }
    });
    // @highlight-end
    updateTimeout.start(UPDATE_INTERVAL, updateTraffic);
  });

  React.useEffect(() => {
    updateTimeout.start(UPDATE_INTERVAL, updateTraffic);
    return updateTimeout.clear;
  }, [liveUpdates, updateTraffic, updateTimeout]);

  const toggleLiveUpdates = () => {
    if (liveUpdates) {
      // @highlight-start
      // Shows the latest traffic now rather than at the end of the window.
      actionsRef.current?.flushTransactions();
      // @highlight-end
    }
    setLiveUpdates(!liveUpdates);
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <Button className={BUTTON_CLASS} onClick={toggleLiveUpdates}>
        {liveUpdates ? 'Stop live updates' : 'Start live updates'}
      </Button>
      <Tree.Root
        defaultItems={items}
        defaultExpandedItems={REGIONS}
        actionsRef={actionsRef}
        // @highlight-start @focus @padding 3
        transactionThrottle={250}
        // @highlight-end
      >
        <Tree.List
          aria-label="Service traffic"
          className="box-content w-68 border border-neutral-200 bg-white p-1 text-neutral-950 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
        >
          {(item: Service) => (
            <Tree.Item itemId={item.id} className={ITEM_CLASS}>
              <Tree.ItemContent className={HIERARCHY_CLASS}>
                <Tree.ItemExpansionTrigger
                  className={`${CONTROL_CLASS} data-expanded:[&_svg]:rotate-90`}
                >
                  <ChevronIcon />
                </Tree.ItemExpansionTrigger>
                <Tree.ItemGroupIndicator className="inline-flex shrink-0 text-neutral-500 dark:text-neutral-400 [&_svg]:size-4">
                  <FolderIcon />
                </Tree.ItemGroupIndicator>
                <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {item.label}
                </span>
                {item.requests != null && (
                  <span className="shrink-0 text-neutral-500 tabular-nums dark:text-neutral-400">
                    {item.requests} req/s
                  </span>
                )}
              </Tree.ItemContent>
            </Tree.Item>
          )}
        </Tree.List>
      </Tree.Root>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M4.5 2 8.5 6l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M1.5 4.5A1.5 1.5 0 0 1 3 3h3.4l1.8 1.7H13a1.5 1.5 0 0 1 1.5 1.5v5.3A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
    </svg>
  );
}
