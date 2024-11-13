'use client';
import { Popover } from '@base_ui/react/Popover';
import * as React from 'react';
import { ToolbarButton } from './ToolbarButton';
import { Popup } from './Popup';

interface PropsTablePopoverProps {
  children: React.ReactElement<any>;
}

export function PropsTablePopover({ children }: PropsTablePopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          // TODO: rework this into an IconButton or a generic ghost button component
          <ToolbarButton>
            <span className="-mx-0.5 flex h-4 w-4 items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="currentcolor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7 0.5C3.41797 0.5 0.5 3.41797 0.5 7C0.5 10.582 3.41797 13.5 7 13.5C10.582 13.5 13.5 10.582 13.5 7C13.5 3.41797 10.582 0.5 7 0.5ZM7 1.5C10.043 1.5 12.5 3.95703 12.5 7C12.5 10.043 10.043 12.5 7 12.5C3.95703 12.5 1.5 10.043 1.5 7C1.5 3.95703 3.95703 1.5 7 1.5ZM6.5 3.5V4.5H7.5V3.5H6.5ZM6.5 6.5V9.5H5.5V10.5H6.5H7.5H8.5V9.5H7.5V6.5V5.5H6.5H5.5V6.5H6.5Z"
                />
              </svg>
            </span>
          </ToolbarButton>
        }
      />
      <Popover.Positioner
        alignment="start"
        side="left"
        alignmentOffset={4}
        sideOffset={4}
        collisionPadding={16}
      >
        <Popover.Popup render={<Popup className="px-4 py-3.5 text-sm" />}>
          <div className="max-w-[300px]">
            <Popover.Description>{children}</Popover.Description>
          </div>
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Root>
  );
}