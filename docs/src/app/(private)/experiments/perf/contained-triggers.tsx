/* eslint-disable @typescript-eslint/no-loop-func */
'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Menu } from '@base-ui-components/react/menu';
import { Tooltip } from '@base-ui-components/react/tooltip';
import { Popover } from '@base-ui-components/react/popover';
import menuDemoStyles from 'docs/src/app/(public)/(content)/react/components/menu/demos/submenu/css-modules/index.module.css';
import tooltipDemoStyles from 'docs/src/app/(public)/(content)/react/components/tooltip/demos/hero/css-modules/index.module.css';
import popoverDemoStyles from 'docs/src/app/(public)/(content)/react/components/popover/demos/_index.module.css';
import styles from './perf.module.css';

type RowData = {
  label: string;
  index: number;
};

const rowCount = 500;
const menuItemCount = 50;

const rows = Array.from({ length: rowCount }).map((_, i) => ({
  label: `Row ${i + 1}`,
  index: i + 1,
}));

const menuItems = Array.from({ length: menuItemCount }).map((_, i) => ({
  label: `Menu Item ${i + 1}`,
  index: i + 1,
}));

let setShowBenchmark: React.Dispatch<React.SetStateAction<boolean>> = (
  _: React.SetStateAction<boolean>,
) => {};

export default function PerfExperiment() {
  const runBenchmark = (iterations = 10, warmupIterations = 5) => {
    const results = [] as number[];

    for (let i = 0; i < warmupIterations + iterations; i += 1) {
      ReactDOM.flushSync(() => {
        setShowBenchmark(false);
      });
      const start = performance.now();
      ReactDOM.flushSync(() => {
        setShowBenchmark(true);
      });
      if (i < warmupIterations) {
        continue;
      }
      const end = performance.now();
      const elapsed = end - start;
      results.push(Math.round(elapsed * 10) / 10);
    }

    console.log(results);
    console.log(
      'Average:',
      Math.round((results.reduce((a, b) => a + b, 0) / results.length) * 10) / 10,
    );
    console.log(
      'Std Dev:',
      (() => {
        const avg = results.reduce((a, b) => a + b, 0) / results.length;
        const squareDiffs = results.map((value) => {
          const diff = value - avg;
          return diff * diff;
        });
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        return +Math.sqrt(avgSquareDiff).toFixed(2);
      })(),
    );
  };

  return (
    <div className={styles.container}>
      <h1>Component performance - contained triggers</h1>
      <div>
        <button type="button" onClick={() => setShowBenchmark((prev) => !prev)}>
          Toggle
        </button>
        <button type="button" onClick={() => runBenchmark(10, 5)} style={{ marginLeft: 8 }}>
          Run 10
        </button>
        <button type="button" onClick={() => runBenchmark(20, 5)} style={{ marginLeft: 8 }}>
          Run 20
        </button>
        <button type="button" onClick={() => runBenchmark(50, 5)} style={{ marginLeft: 8 }}>
          Run 50
        </button>
      </div>
      <Container />
    </div>
  );
}

function Container() {
  const [showBenchmark, setShowBenchmarkLocal] = React.useState(false);

  setShowBenchmark = setShowBenchmarkLocal;

  if (!showBenchmark) {
    return null;
  }

  return <Benchmark />;
}
function Benchmark() {
  return (
    <div className={styles.rows}>
      {rows.map((row) => (
        <div key={row.index} className={styles.row}>
          <span className={styles.label}>{row.label}</span>
          <span className={styles.actions}>
            <RowPopover rowData={row} />
            <RowMenu rowData={row} />
          </span>
        </div>
      ))}
    </div>
  );
}

interface RowMenuProps {
  rowData: RowData;
}

function RowMenu({ rowData }: RowMenuProps) {
  return (
    <Menu.Root>
      <Tooltip.Root>
        <Tooltip.Trigger
          className={menuDemoStyles.Trigger}
          data-id={rowData.index}
          render={(props) => <Menu.Trigger {...props} />}
        >
          •••
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={10}>
            <Tooltip.Popup className={tooltipDemoStyles.Popup}>
              <Tooltip.Arrow className={tooltipDemoStyles.Arrow}>
                <ArrowSvg />
              </Tooltip.Arrow>
              Actions menu for {rowData.label}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} className={menuDemoStyles.Positioner}>
          <Menu.Popup className={menuDemoStyles.Popup}>
            <Menu.Arrow className={menuDemoStyles.Arrow}>
              <ArrowSvg />
            </Menu.Arrow>
            {menuItems.map((item) => (
              <Menu.Item
                key={item.index}
                onClick={() => console.log(`Clicked ${item.label} for ${rowData.label}`)}
                className={menuDemoStyles.Item}
              >
                {item.label} for {rowData.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function RowPopover({ rowData }: RowMenuProps) {
  return (
    <Popover.Root>
      <Popover.Trigger className={popoverDemoStyles.Button}>info</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} className={popoverDemoStyles.Positioner}>
          <Popover.Popup className={popoverDemoStyles.Popup}>
            <Popover.Arrow className={popoverDemoStyles.Arrow}>
              <ArrowSvg />
            </Popover.Arrow>
            {rowData && <div>Details for {rowData.label}</div>}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={menuDemoStyles.ArrowFill}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={menuDemoStyles.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={menuDemoStyles.ArrowInnerStroke}
      />
    </svg>
  );
}
