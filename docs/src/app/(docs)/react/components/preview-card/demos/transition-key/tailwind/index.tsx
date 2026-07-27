'use client';
import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';

type View = 'overview' | 'details';

const tabClassName =
  'box-border h-7 flex-1 border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-2 font-[inherit] text-[0.8125rem] leading-none text-neutral-950 dark:text-white select-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

const activeTabClassName =
  'box-border h-7 flex-1 border border-neutral-950 dark:border-white bg-neutral-950 dark:bg-white px-2 font-[inherit] text-[0.8125rem] leading-none text-white dark:text-neutral-950 select-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

export default function PreviewCardTransitionKeyDemo() {
  const [view, setView] = React.useState<View>('overview');

  return (
    <PreviewCard.Root
      onOpenChangeComplete={(open) => {
        if (!open) {
          setView('overview');
        }
      }}
    >
      <p className="m-0 text-base leading-6 text-balance text-neutral-950 dark:text-white">
        Read more about{' '}
        <PreviewCard.Trigger
          className="text-neutral-950 dark:text-white underline decoration-[1px] underline-offset-2 outline-none focus-visible:no-underline focus-visible:outline-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
          href="https://base-ui.com"
        >
          Base UI
        </PreviewCard.Trigger>
        .
      </p>

      <PreviewCard.Portal>
        <PreviewCard.Positioner
          sideOffset={8}
          className="h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] transition-[top,left,right,bottom,transform] duration-[0.35s] ease-[cubic-bezier(0.22,1,0.36,1)]"
        >
          <PreviewCard.Popup className="relative h-[var(--popup-height,auto)] w-[var(--popup-width,auto)] origin-[var(--transform-origin)] border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white outline-none shadow-[0.25rem_0.25rem_0] shadow-black/12 dark:shadow-none transition-[width,height,scale,opacity] duration-[0.35s,0.35s,100ms,100ms] ease-[cubic-bezier(0.22,1,0.36,1),cubic-bezier(0.22,1,0.36,1),ease-out,ease-out] data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <PreviewCard.Arrow className="relative block w-3 h-1.5 overflow-clip data-[side=bottom]:top-[-6px] data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:content-[''] before:absolute before:bottom-0 before:left-1/2 before:box-border before:w-[calc(6px*sqrt(2))] before:h-[calc(6px*sqrt(2))] before:bg-white dark:before:bg-neutral-950 before:border before:border-neutral-950 dark:before:border-white before:[transform:translate(-50%,50%)_rotate(45deg)]" />
            <PreviewCard.Viewport
              transitionKey={view}
              className={`
                relative h-full w-full overflow-clip p-3
                [&_[data-current]]:w-[calc(var(--popup-width)-1.5rem)]
                [&_[data-current]]:opacity-100
                [&_[data-current]]:transition-opacity
                [&_[data-current]]:duration-[175ms]
                [&_[data-current]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                [&_[data-current][data-starting-style]]:opacity-0
                [&_[data-previous]]:w-[calc(var(--popup-width)-1.5rem)]
                [&_[data-previous]]:opacity-100
                [&_[data-previous]]:transition-opacity
                [&_[data-previous]]:duration-[175ms]
                [&_[data-previous]]:ease-[cubic-bezier(0.22,1,0.36,1)]
                [&_[data-previous][data-ending-style]]:opacity-0`}
            >
              {view === 'overview' ? (
                <div className="flex w-72 flex-col items-start gap-2">
                  <div className="flex gap-1 self-stretch">
                    <button type="button" className={activeTabClassName}>
                      Overview
                    </button>
                    <button
                      type="button"
                      className={tabClassName}
                      onClick={() => setView('details')}
                    >
                      Details
                    </button>
                  </div>
                  <p className="m-0 text-sm leading-5">
                    Base UI is a library of unstyled React components for building accessible user
                    interfaces.
                  </p>
                </div>
              ) : (
                <div className="flex w-72 flex-col items-start gap-2">
                  <div className="flex gap-1 self-stretch">
                    <button
                      type="button"
                      className={tabClassName}
                      onClick={() => setView('overview')}
                    >
                      Overview
                    </button>
                    <button type="button" className={activeTabClassName}>
                      Details
                    </button>
                  </div>
                  <dl className="m-0 flex flex-col gap-1 self-stretch">
                    <div className="flex justify-between gap-4 text-sm leading-5">
                      <dt className="text-neutral-600 dark:text-neutral-400">License</dt>
                      <dd className="m-0">MIT</dd>
                    </div>
                    <div className="flex justify-between gap-4 text-sm leading-5">
                      <dt className="text-neutral-600 dark:text-neutral-400">Bundle</dt>
                      <dd className="m-0">Tree-shakeable</dd>
                    </div>
                    <div className="flex justify-between gap-4 text-sm leading-5">
                      <dt className="text-neutral-600 dark:text-neutral-400">Styling</dt>
                      <dd className="m-0">Bring your own</dd>
                    </div>
                  </dl>
                </div>
              )}
            </PreviewCard.Viewport>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}
