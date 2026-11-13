'use client';
import * as React from 'react';
import { Button } from '@base-ui/react/button';
import { Tree } from '@base-ui/react/tree';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import styles from './index.module.css';

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
    <div className={styles.Container}>
      <Button className={styles.Button} onClick={toggleLiveUpdates}>
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
        <Tree.List aria-label="Service traffic" className={styles.Tree}>
          {(item: Service) => (
            <Tree.Item itemId={item.id} className={styles.Item}>
              <Tree.ItemContent className={styles.ItemContent}>
                <Tree.ItemExpansionTrigger className={styles.ExpansionTrigger}>
                  <ChevronIcon />
                </Tree.ItemExpansionTrigger>
                <Tree.ItemGroupIndicator className={styles.GroupIndicator}>
                  <FolderIcon />
                </Tree.ItemGroupIndicator>
                <span className={styles.Label}>{item.label}</span>
                {item.requests != null && (
                  <span className={styles.Requests}>{item.requests} req/s</span>
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
