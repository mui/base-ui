import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { benchmark } from '@mui/internal-benchmark';
import { createRows, MountList } from './shared';

const containedTooltipRows = createRows(500, 'Tooltip');
const detachedTooltipRows = createRows(500, 'Tooltip');
const tooltipOpenRows = createRows(300, 'Tooltip');

function ContainedTooltipList() {
  return (
    <MountList rows={containedTooltipRows}>
      {(row) => (
        <Tooltip.Root key={row.id}>
          <Tooltip.Trigger delay={0} aria-label={`Show ${row.label}`}>
            {row.label}
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup>Tooltip for {row.label}</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}
    </MountList>
  );
}

function DetachedTooltipList() {
  const handleRef = React.useRef<Tooltip.Handle<(typeof detachedTooltipRows)[number]> | null>(null);
  if (handleRef.current == null) {
    handleRef.current = Tooltip.createHandle();
  }

  const handle = handleRef.current;

  return (
    <React.Fragment>
      <div>
        {detachedTooltipRows.map((row) => (
          <Tooltip.Trigger
            key={row.id}
            handle={handle}
            payload={row}
            delay={0}
            aria-label={`Show detached ${row.label}`}
          >
            {row.label}
          </Tooltip.Trigger>
        ))}
      </div>

      <Tooltip.Root handle={handle}>
        {({ payload }) =>
          payload ? (
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={8}>
                <Tooltip.Popup>Tooltip for {payload.label}</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          ) : null
        }
      </Tooltip.Root>
    </React.Fragment>
  );
}

function DenseTooltipSurface() {
  return (
    <MountList rows={tooltipOpenRows}>
      {(row) => (
        <Tooltip.Root key={row.id}>
          <Tooltip.Trigger delay={0} aria-label={`Open tooltip benchmark ${row.id}`}>
            {row.label}
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup>Tooltip for {row.label}</Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      )}
    </MountList>
  );
}

benchmark('Tooltip mount (500 contained roots)', () => <ContainedTooltipList />);

benchmark('Tooltip mount (500 detached triggers)', () => <DetachedTooltipList />);

benchmark(
  'Tooltip open (300 mounted tooltips)',
  () => <DenseTooltipSurface />,
  async () => {
    document.querySelector<HTMLElement>('[aria-label="Open tooltip benchmark 1"]')?.focus();
  },
);
