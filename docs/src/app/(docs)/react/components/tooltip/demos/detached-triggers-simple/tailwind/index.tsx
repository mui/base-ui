'use client';
import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { InfoIcon } from '../../icons-tw';

const demoTooltip = Tooltip.createHandle();

const triggerClass =
  'flex size-8 items-center justify-center border border-neutral-950 bg-white text-neutral-950 select-none data-popup-open:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 hover:bg-neutral-50 active:bg-neutral-100 dark:border-white dark:bg-neutral-950 dark:text-white dark:data-popup-open:bg-neutral-800 dark:hover:bg-neutral-900 dark:active:bg-neutral-800';

const popupClass =
  'relative border border-neutral-950 bg-white px-2 py-1 text-sm text-neutral-950 origin-[var(--transform-origin)] [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[scale,opacity] duration-100 ease-out data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.98] data-[instant]:transition-none data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.98] dark:border-white dark:bg-neutral-950 dark:text-white dark:[filter:none]';

const arrowClass =
  "relative block w-3 h-1.5 overflow-clip data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:box-border before:w-[calc(6px*sqrt(2))] before:h-[calc(6px*sqrt(2))] before:bg-white dark:before:bg-neutral-950 before:border before:border-neutral-950 dark:before:border-white before:[transform:translate(-50%,50%)_rotate(45deg)]";

export default function TooltipDetachedTriggersSimpleDemo() {
  return (
    <Tooltip.Provider>
      <Tooltip.Trigger className={triggerClass} handle={demoTooltip}>
        <InfoIcon aria-label="This is a detached tooltip" />
      </Tooltip.Trigger>

      <Tooltip.Root handle={demoTooltip}>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={11}>
            <Tooltip.Popup className={popupClass}>
              <Tooltip.Arrow className={arrowClass} />
              This is a detached tooltip
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
