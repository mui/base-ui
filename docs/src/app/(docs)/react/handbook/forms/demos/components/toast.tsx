'use client';
import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { X } from 'lucide-react';

function Toasts() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className="[--gap:0.75rem] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] mr-0 w-full origin-bottom [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] rounded-lg border border-gray-200 bg-gray-50 bg-clip-padding p-4 shadow-lg select-none after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-[''] data-[ending-style]:opacity-0 data-[limited]:opacity-0 data-[starting-style]:[transform:translateY(150%)] [&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)] data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] h-[var(--height)] [transition:transform_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.5s,height_0.15s]"
    >
      <Toast.Content className="overflow-hidden transition-opacity [transition-duration:250ms]">
        <Toast.Title className="text-[0.975rem] leading-5 font-medium" />
        <Toast.Description className="text-[0.925rem] leading-5 text-gray-700" />
        <div
          className="text-xs mt-2 p-3 py-2 bg-gray-100 text-gray-900 font-medium rounded-md select-text"
          data-swipe-ignore
        >
          <pre className="whitespace-pre-wrap">{JSON.stringify(toast.data, null, 2)}</pre>
        </div>
        <Toast.Close
          className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded border-none bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="size-4" />
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
