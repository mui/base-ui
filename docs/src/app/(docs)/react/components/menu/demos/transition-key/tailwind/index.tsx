'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';

type View = 'main' | 'more';

const triggerClassName =
  'flex h-8 items-center justify-center border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 px-3 text-sm font-normal whitespace-nowrap text-neutral-950 dark:text-white select-none hover:bg-neutral-100 dark:hover:bg-neutral-800 active:bg-neutral-200 dark:active:bg-neutral-700 data-popup-open:bg-neutral-100 dark:data-popup-open:bg-neutral-800 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';

const itemClassName = `
  flex cursor-default items-center justify-between gap-6 px-4 py-2
  text-sm leading-4 outline-none select-none
  data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white
  data-highlighted:before:absolute data-highlighted:before:inset-x-1
  data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1]
  data-highlighted:before:bg-neutral-950 data-highlighted:before:content-['']
  dark:data-highlighted:text-neutral-950 dark:data-highlighted:before:bg-white
`;

const separatorClassName = 'mx-1 my-1 h-px bg-neutral-950 dark:bg-white';

export default function MenuTransitionKeyDemo() {
  const [view, setView] = React.useState<View>('main');

  return (
    <Menu.Root
      onOpenChangeComplete={(open) => {
        if (!open) {
          setView('main');
        }
      }}
    >
      <Menu.Trigger className={triggerClassName}>Options</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          sideOffset={8}
          className="h-[var(--positioner-height)] w-[var(--positioner-width)] max-w-[var(--available-width)] outline-none transition-[top,left,right,bottom,transform] duration-100 ease-out"
        >
          <Menu.Popup className="relative h-[var(--popup-height,auto)] w-[var(--popup-width,auto)] origin-[var(--transform-origin)] border border-neutral-950 dark:border-white bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white outline-none shadow-[0.25rem_0.25rem_0] shadow-black/12 dark:shadow-none transition-[width,height,opacity,scale] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
            <Menu.Viewport
              transitionKey={view}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft' && view === 'more') {
                  setView('main');
                }
              }}
              className={`
                relative h-full w-full overflow-clip py-1
                [&_[data-current]]:w-[calc(var(--popup-width)-2px)]
                [&_[data-current]]:transition-[translate]
                [&_[data-current]]:duration-100
                [&_[data-current]]:ease-out
                data-[activation-direction='forward']:[&_[data-current][data-starting-style]]:translate-x-full
                data-[activation-direction='back']:[&_[data-current][data-starting-style]]:-translate-x-full
                [&_[data-previous]]:w-[calc(var(--popup-width)-2px)]
                [&_[data-previous]]:transition-[translate]
                [&_[data-previous]]:duration-100
                [&_[data-previous]]:ease-out
                data-[activation-direction='forward']:[&_[data-previous][data-ending-style]]:-translate-x-full
                data-[activation-direction='back']:[&_[data-previous][data-ending-style]]:translate-x-full`}
            >
              {view === 'main' ? (
                <div className="flex flex-col">
                  <Menu.Item className={itemClassName}>New window</Menu.Item>
                  <Menu.Item className={itemClassName}>Open file</Menu.Item>
                  <Menu.Separator className={separatorClassName} />
                  <Menu.Item
                    className={itemClassName}
                    closeOnClick={false}
                    onClick={() => setView('more')}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowRight') {
                        setView('more');
                      }
                    }}
                  >
                    More tools
                    <CaretRightIcon className="flex-none" />
                  </Menu.Item>
                </div>
              ) : (
                <div className="flex flex-col">
                  <Menu.Item
                    className={itemClassName}
                    closeOnClick={false}
                    onClick={() => setView('main')}
                  >
                    <CaretLeftIcon className="flex-none" />
                    Back
                  </Menu.Item>
                  <Menu.Separator className={separatorClassName} />
                  <Menu.Item className={itemClassName}>Developer tools</Menu.Item>
                  <Menu.Item className={itemClassName}>Task manager</Menu.Item>
                  <Menu.Item className={itemClassName}>Clear browsing data</Menu.Item>
                  <Menu.Item className={itemClassName}>Extensions</Menu.Item>
                </div>
              )}
            </Menu.Viewport>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}

function CaretLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M10 4v8L5.5 8z" />
    </svg>
  );
}
