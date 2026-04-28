'use client';
import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { Button } from '@base-ui/react/button';
import { Tooltip } from '@base-ui/react/tooltip';

const stackedToastManager = Toast.createToastManager();
const anchoredToastManager = Toast.createToastManager();

export default function ExampleToast() {
  return (
    <Tooltip.Provider>
      <Toast.Provider toastManager={anchoredToastManager}>
        <AnchoredToasts />
      </Toast.Provider>
      <Toast.Provider toastManager={stackedToastManager}>
        <StackedToasts />
      </Toast.Provider>

      <div className="flex items-center gap-2">
        <CopyButton />
        <StackedToastButton />
      </div>
    </Tooltip.Provider>
  );
}

function StackedToastButton() {
  function createToast() {
    stackedToastManager.add({
      description: 'Copied',
    });
  }

  return (
    <button
      type="button"
      className="flex h-8 items-center justify-center rounded-none border border-gray-950 bg-white px-3 py-0 font-[inherit] text-sm font-normal text-gray-950 select-none hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 active:bg-gray-100 dark:border-white dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900 dark:active:bg-gray-800"
      onClick={createToast}
    >
      Stacked toast
    </button>
  );
}

function CopyButton() {
  const [copied, setCopied] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  function handleCopy() {
    setCopied(true);

    anchoredToastManager.add({
      description: 'Copied',
      positionerProps: {
        anchor: buttonRef.current,
        sideOffset: 10,
      },
      timeout: 1500,
      onClose() {
        setCopied(false);
      },
    });
  }

  return (
    <Tooltip.Root disabled={copied}>
      <Tooltip.Trigger
        ref={buttonRef}
        closeOnClick={false}
        className="flex h-8 w-8 items-center justify-center rounded-none border border-gray-950 bg-white text-gray-950 select-none hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 active:bg-gray-100 dark:border-white dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900 dark:active:bg-gray-800"
        onClick={handleCopy}
        aria-label="Copy to clipboard"
        render={<Button disabled={copied} focusableWhenDisabled />}
      >
        {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8}>
          <Tooltip.Popup className="flex origin-[var(--transform-origin)] flex-col border border-gray-950 bg-white px-2 py-1 text-sm text-gray-950 [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[transform,opacity] duration-100 ease-out data-ending-style:[transform:scale(0.98)] data-ending-style:opacity-0 data-instant:duration-0 data-starting-style:[transform:scale(0.98)] data-starting-style:opacity-0 dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]">
            <Tooltip.Arrow className="relative block h-1.5 w-3 overflow-clip data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:absolute before:bottom-0 before:left-1/2 before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:border before:border-gray-950 before:bg-white before:content-[''] before:[transform:translate(-50%,50%)_rotate(45deg)] dark:before:border-white dark:before:bg-gray-950" />
            Copy
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function AnchoredToasts() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport className="outline-0">
        {toasts.map((toast) => (
          <Toast.Positioner
            key={toast.id}
            toast={toast}
            className="z-[calc(1000-var(--toast-index))]"
          >
            <Toast.Root
              toast={toast}
              className="flex w-max origin-[var(--transform-origin)] flex-col border border-gray-950 bg-white px-2 py-1 text-sm text-gray-950 [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] transition-[transform,opacity] duration-100 ease-out data-ending-style:[transform:scale(0.98)] data-ending-style:opacity-0 data-starting-style:[transform:scale(0.98)] data-starting-style:opacity-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none]"
            >
              <Toast.Arrow className="relative block h-1.5 w-3 overflow-clip data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180 before:absolute before:bottom-0 before:left-1/2 before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:border before:border-gray-950 before:bg-white before:content-[''] before:[transform:translate(-50%,50%)_rotate(45deg)] dark:before:border-white dark:before:bg-gray-950" />
              <Toast.Content>
                <Toast.Description />
              </Toast.Content>
            </Toast.Root>
          </Toast.Positioner>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

function StackedToasts() {
  const { toasts } = Toast.useToastManager();
  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed top-auto right-[1rem] bottom-[1rem] z-1 mx-auto w-[calc(100vw-2rem)] sm:right-[2rem] sm:bottom-[2rem] sm:w-[22.5rem]">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className="[--gap:0.75rem] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] mr-0 w-full origin-bottom [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] border border-gray-950 bg-white p-3 text-gray-950 [filter:drop-shadow(4px_4px_0_rgb(0_0_0_/_12%))] select-none dark:border-white dark:bg-gray-950 dark:text-white dark:[filter:none] after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-[''] data-[ending-style]:opacity-0 data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--offset-y)))] data-[limited]:opacity-0 data-[starting-style]:[transform:translateY(150%)] [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)] data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] h-[var(--height)] data-[expanded]:h-[var(--toast-height)] [transition:transform_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.5s,height_0.15s]"
          >
            <Toast.Content className="flex items-center gap-4 overflow-hidden transition-opacity duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] data-[behind]:opacity-0 data-[expanded]:opacity-100">
              <div className="min-w-0 flex-1">
                <Toast.Title className="text-sm font-bold" />
                <Toast.Description className="text-sm" />
              </div>
              <Toast.Close className="flex h-8 shrink-0 items-center justify-center rounded-none border border-gray-950 bg-white px-3 py-0 font-[inherit] text-sm font-normal text-gray-950 hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-800 active:bg-gray-100 dark:border-white dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900 dark:active:bg-gray-800">
                Dismiss
              </Toast.Close>
            </Toast.Content>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}

function ClipboardIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
