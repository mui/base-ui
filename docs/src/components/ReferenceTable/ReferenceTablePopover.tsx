'use client';
import { Popover } from '@base-ui-components/react/popover';
import * as React from 'react';
import { useMediaQuery } from '@base-ui-components/react/unstable-use-media-query';
import { GhostButton } from '../GhostButton';
import { Popup } from '../Popup';

export function ReferenceTablePopover({ children }: React.PropsWithChildren) {
  const isMobile = useMediaQuery('@media (width < 48rem)', { noSsr: true });
  return (
    <Popover.Root openOnHover delay={100} modal>
      <Popover.Trigger
        render={
          <GhostButton aria-label="Info" layout="icon">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentcolor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7 0.5C3.41797 0.5 0.5 3.41797 0.5 7C0.5 10.582 3.41797 13.5 7 13.5C10.582 13.5 13.5 10.582 13.5 7C13.5 3.41797 10.582 0.5 7 0.5ZM7 1.5C10.043 1.5 12.5 3.95703 12.5 7C12.5 10.043 10.043 12.5 7 12.5C3.95703 12.5 1.5 10.043 1.5 7C1.5 3.95703 3.95703 1.5 7 1.5ZM6.5 3.5V4.5H7.5V3.5H6.5ZM6.5 6.5V9.5H5.5V10.5H6.5H7.5H8.5V9.5H7.5V6.5V5.5H6.5H5.5V6.5H6.5Z" />
            </svg>
          </GhostButton>
        }
      />
      <Popover.Portal>
        <Popover.Positioner
          align={isMobile ? 'end' : 'start'}
          side={isMobile ? 'bottom' : 'left'}
          alignOffset={-4}
          sideOffset={9}
          collisionPadding={16}
        >
          <Popover.Popup render={<Popup className="px-4 py-3 text-md" />}>
            <div className="flex max-w-72 flex-col gap-3 text-pretty">{children}</div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
