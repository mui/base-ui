'use client';
import * as React from 'react';
import { Toast } from '@base-ui/react/toast';

function Toasts() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className="[--gap:0.75rem] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] mr-0 w-full origin-bottom transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] border border-neutral-950 bg-white p-3 text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 select-none dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-[''] data-ending-style:opacity-0 data-limited:opacity-0 data-starting-style:transform-[translateY(150%)] [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:transform-[translateY(150%)] data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+150%))] data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-150%))] h-(--height) [transition:transform_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.5s,height_0.15s]"
    >
      <Toast.Content className="overflow-hidden transition-opacity duration-250">
        <Toast.Title className="text-sm font-bold" />
        <Toast.Description className="text-sm text-neutral-700 dark:text-neutral-300" />
        <div
          className="mt-2 border border-neutral-950 p-2 text-xs select-text dark:border-white"
          data-base-ui-swipe-ignore
        >
          <pre className="whitespace-pre-wrap">{JSON.stringify(toast.data, null, 2)}</pre>
        </div>
        <Toast.Close
          className="absolute top-2 right-2 flex size-6 items-center justify-center border-0 bg-transparent p-0 text-neutral-950 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-950 dark:focus-visible:outline-white dark:text-white dark:hover:bg-neutral-800 dark:active:bg-neutral-700"
          aria-label="Close"
        >
          <XIcon />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

export function ToastProvider(props: { children: React.ReactNode }) {
  return (
    <Toast.Provider limit={1}>
      {props.children}
      <Toast.Portal>
        <Toast.Viewport className="fixed z-10 top-auto right-[1rem] bottom-[1rem] mx-auto flex w-[250px] sm:right-[2rem] sm:bottom-[2rem] sm:w-[360px]">
          <Toasts />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

export const useToastManager = Toast.useToastManager;

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M18 6 6 18" vectorEffect="non-scaling-stroke" />
      <path d="m6 6 12 12" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
