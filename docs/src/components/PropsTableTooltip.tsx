'use client';
import { Tooltip } from '@base_ui/react/Tooltip';
import * as React from 'react';
import { ToolbarButton } from './ToolbarButton';
import { Popup } from './Popup';

export function PropsTableTooltip({ children }: React.PropsWithChildren) {
  const [open, setOpen] = React.useState(false);

  return (
    // TODO: this was more effort than I expected, we need to chat about popovers that open on hover
    <Tooltip.Root
      delay={0}
      closeDelay={50}
      open={open}
      onOpenChange={(newOpen, event, reason) => {
        // Open/close on click like popovers
        if (reason === 'reference-press' && open === newOpen) {
          setOpen(!newOpen);
          return;
        }

        setOpen(newOpen);
      }}
    >
      <Tooltip.Trigger
        render={
          // TODO: rework this into an IconButton or a generic ghost button component
          <ToolbarButton
            role="group"
            aria-label={getTextContents(children)}
            onKeyDown={(event) => {
              // Open/close on enter/spacebar like popovers
              if (event.key === 'Enter' || event.key === ' ') {
                setOpen((currentOpen) => !currentOpen);
              }
            }}
          >
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
      <Tooltip.Positioner
        alignment="start"
        side="left"
        alignmentOffset={4}
        sideOffset={4}
        collisionPadding={16}
      >
        <Tooltip.Popup render={<Popup className="p-4 text-sm" />}>
          <div className="max-w-[300px]">{children}</div>
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
}

function getTextContents(node?: React.ReactNode): string {
  if (hasChildren(node)) {
    return getTextContents(node.props?.children);
  }

  if (Array.isArray(node)) {
    return node.map(getTextContents).flat().filter(Boolean).join('');
  }

  if (typeof node === 'string') {
    return node;
  }

  return '';
}

function hasChildren(
  element?: React.ReactNode,
): element is React.ReactElement<React.PropsWithChildren> {
  return (
    React.isValidElement(element) &&
    typeof element.props === 'object' &&
    !!element.props &&
    'children' in element.props &&
    Boolean(element.props.children)
  );
}
