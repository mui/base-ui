'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { ArrowSvg, InfoIcon } from '../../icons-tw';

const demoTooltip = Tooltip.createHandle();

export default function TooltipDetachedTriggersSimpleDemo() {
  return (
    <Tooltip.Provider>
      <Tooltip.Trigger
        className="
          flex size-10 items-center justify-center
          border border-gray-200 rounded-md
          bg-gray-50
          text-gray-900
          select-none
          data-popup-open:bg-gray-100
          focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800
          hover:bg-gray-100
          active:bg-gray-100"
        handle={demoTooltip}
      >
        <InfoIcon aria-label="This is a detached tooltip" />
      </Tooltip.Trigger>

      <Tooltip.Root handle={demoTooltip}>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={10}>
            <Tooltip.Popup
              className="
                px-2 py-1
                rounded-md
                bg-[canvas]
                text-sm
                origin-(--transform-origin)
                shadow-lg shadow-gray-200 outline-1 outline-gray-200
                transition-[transform,scale,opacity]
                data-ending-style:opacity-0 data-ending-style:scale-90
                data-instant:transition-none
                data-starting-style:opacity-0 data-starting-style:scale-90
                dark:shadow-none dark:outline-gray-300 dark:-outline-offset-1"
            >
              <Tooltip.Arrow
                className="
                  flex
                  data-[side=bottom]:-top-2 data-[side=bottom]:rotate-0
                  data-[side=left]:right-[-13px] data-[side=left]:rotate-90
                  data-[side=right]:left-[-13px] data-[side=right]:-rotate-90
                  data-[side=top]:-bottom-2 data-[side=top]:rotate-180"
              >
                <ArrowSvg />
              </Tooltip.Arrow>
              This is a detached tooltip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
