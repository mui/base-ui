'use client';
import * as React from 'react';
import { Toast } from '@base-ui/react/toast';

interface CustomToastData {
  userId: string;
}

function isCustomToast(
  toast: Toast.Root.ToastObject,
): toast is Toast.Root.ToastObject<CustomToastData> {
  return toast.data?.userId !== undefined;
}

export default function CustomToastExample() {
  return (
    <Toast.Provider>
      <CustomToast />
      <Toast.Portal>
        <Toast.Viewport className="fixed top-auto right-4 bottom-4 left-auto z-1 mx-auto w-[calc(100vw-2rem)] min-[500px]:right-8 min-[500px]:bottom-8 min-[500px]:w-[22.5rem]">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function CustomToast() {
  const toastManager = Toast.useToastManager();

  function action() {
    const data: CustomToastData = {
      userId: '123',
    };

    toastManager.add({
      title: 'Toast with custom data',
      data,
    });
  }

  return (
    <button
      type="button"
      onClick={action}
      className="box-border m-0 flex h-8 items-center justify-center gap-2 rounded-none border border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white px-3 py-0 font-[inherit] text-sm leading-none font-normal whitespace-nowrap select-none hover:bg-neutral-100 active:bg-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
    >
      Create custom toast
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className="[--gap:0.75rem] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] mr-0 w-full origin-bottom [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] border border-neutral-950 bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 select-none dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-[''] data-ending-style:opacity-0 data-expanded:not-data-starting-style:not-data-ending-style:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--offset-y)))] data-limited:opacity-0 data-starting-style:[transform:translateY(150%)] data-ending-style:[transform:translateY(150%)] data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] h-[var(--height)] data-expanded:h-[var(--toast-height)] [transition:transform_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.5s,height_0.15s] box-border mx-auto cursor-default focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white"
    >
      <Toast.Content className="box-border flex items-center gap-4 p-3 overflow-hidden transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100 data-behind:data-expanded:opacity-100">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Toast.Title className="m-0 text-sm font-bold">{toast.title}</Toast.Title>
          {isCustomToast(toast) && toast.data ? (
            <Toast.Description className="m-0 text-sm">
              data.userId is {toast.data.userId}
            </Toast.Description>
          ) : (
            <Toast.Description className="m-0 text-sm" />
          )}
        </div>
        <Toast.Close className="flex h-8 shrink-0 items-center justify-center gap-2 rounded-none border border-neutral-950 bg-white text-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white px-3 py-0 font-[inherit] text-sm leading-none font-normal whitespace-nowrap hover:not-data-disabled:bg-neutral-100 active:not-data-disabled:bg-neutral-200 dark:hover:not-data-disabled:bg-neutral-800 dark:active:not-data-disabled:bg-neutral-700 data-disabled:border-neutral-500 data-disabled:text-neutral-500 dark:data-disabled:border-neutral-400 dark:data-disabled:text-neutral-400 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white">
          Dismiss
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}
