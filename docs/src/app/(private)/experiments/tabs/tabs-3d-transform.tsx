'use client';
import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import classes from './tabs-3d-transform.module.css';

const TABS = [
  {
    value: 'overview',
    label: 'Overview',
    panel: 'The indicator should stay attached to this tab before and after the card rotates.',
  },
  {
    value: 'features',
    label: 'Features',
    panel: 'Switching tabs during the transform should not leave a projected offset behind.',
  },
  {
    value: 'releases',
    label: 'Releases',
    panel:
      'This tab mirrors the standard overflow experiment so width changes are easy to compare.',
  },
  {
    value: 'support',
    label: 'Support',
    panel: 'This longer label makes the indicator width and left offset easier to inspect.',
  },
] as const;

type TabValue = (typeof TABS)[number]['value'];

function getNextTabValue(value: TabValue) {
  const index = TABS.findIndex((tab) => tab.value === value);
  return TABS[(index + 1) % TABS.length].value;
}

export default function Tabs3DTransformExperiment() {
  const [value, setValue] = React.useState<TabValue>('overview');
  const [rotated, setRotated] = React.useState(false);
  const switchTabTimeout = useTimeout();

  const switchTab = useStableCallback(() => {
    setValue((currentValue) => getNextTabValue(currentValue));
  });

  const flip = useStableCallback(() => {
    setRotated((currentRotated) => !currentRotated);
  });

  const switchTabDuringFlip = useStableCallback(() => {
    flip();
    switchTabTimeout.start(220, switchTab);
  });

  return (
    <main className={classes.experiment}>
      <header className={classes.header}>
        <div>
          <h1>Tabs indicator 3D transform</h1>
          <p>
            The active tab changes while the parent is rotated with perspective. The indicator
            should remain aligned after the transform settles.
          </p>
        </div>

        <div className={classes.controls}>
          <button type="button" onClick={flip}>
            Flip
          </button>
          <button type="button" onClick={switchTabDuringFlip}>
            Switch during flip
          </button>
          <button type="button" onClick={switchTab}>
            Switch tab
          </button>
        </div>
      </header>

      <section className={classes.stage}>
        <div className={classes.scene}>
          <div className={classes.card} data-rotated={rotated ? '' : undefined}>
            <Tabs.Root className={classes.tabs} value={value} onValueChange={setValue}>
              <Tabs.List className={classes.list}>
                {TABS.map((tab) => (
                  <Tabs.Tab className={classes.tab} key={tab.value} value={tab.value}>
                    {tab.label}
                  </Tabs.Tab>
                ))}
                <Tabs.Indicator className={classes.indicator} renderBeforeHydration />
              </Tabs.List>

              {TABS.map((tab) => (
                <Tabs.Panel className={classes.panel} key={tab.value} value={tab.value}>
                  {tab.panel}
                </Tabs.Panel>
              ))}
            </Tabs.Root>

            <dl className={classes.readout}>
              <div>
                <dt>Active</dt>
                <dd>{value}</dd>
              </div>
              <div>
                <dt>Transform</dt>
                <dd>{rotated ? 'rotateY(-52deg)' : 'none'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </main>
  );
}
