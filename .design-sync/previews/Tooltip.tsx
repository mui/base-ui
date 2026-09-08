import * as React from 'react';
import { Tooltip } from '@base-ui/react';
import './Tooltip.css';

function InfoIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm.75 10.5h-1.5v-4h1.5v4Zm0-5.5h-1.5V4.5h1.5V6Z" />
    </svg>
  );
}

export const Basic = () => (
  <Tooltip.Provider>
    <div className="Panel">
      <Tooltip.Root defaultOpen>
        <Tooltip.Trigger className="Button" aria-label="Help">
          <InfoIcon aria-hidden="true" />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={11}>
            <Tooltip.Popup className="Popup">
              <Tooltip.Arrow className="Arrow" />
              Saves your changes automatically
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  </Tooltip.Provider>
);
