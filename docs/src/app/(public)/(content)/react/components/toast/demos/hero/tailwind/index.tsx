'use client';
import * as React from 'react';
import { Toast } from '@base-ui-components/react/toast';

export default function ExampleToast() {
  return (
    <Toast.Provider>
      <ToastButton />
      <Toast.Viewport
        // prettier-ignore
        className="
          fixed mx-auto flex w-full max-w-[320px]
          data-[position=top]:top-4 data-[position=top]:right-0 data-[position=top]:left-0
          data-[position=bottom]:bottom-4 data-[position=bottom]:right-0 data-[position=bottom]:left-0
          data-[position=top-left]:top-4 data-[position=top-left]:left-4 data-[position=top-left]:items-start
          data-[position=top-right]:top-4 data-[position=top-right]:right-4 data-[position=top-right]:items-end
          data-[position=bottom-left]:bottom-4 data-[position=bottom-left]:left-4 data-[position=bottom-left]:top-auto data-[position=bottom-left]:items-start
          data-[position=bottom-right]:bottom-4 data-[position=bottom-right]:right-4 data-[position=bottom-right]:top-auto data-[position=bottom-right]:items-end
        "
        data-position="top"
      >
        <ToastList />
      </Toast.Viewport>
    </Toast.Provider>
  );
}

function ToastButton() {
  const toast = Toast.useToast();
  const [count, setCount] = React.useState(0);

  function createToast() {
    setCount((prev) => prev + 1);
    toast.add({
      title: `Toast ${count + 1} created`,
      description: 'This is a toast notification.',
    });
  }

  return (
    <button
      type="button"
      className="box-border flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 py-0 font-medium text-gray-900 outline-0 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue active:bg-gray-100"
      onClick={createToast}
    >
      Create toast
    </button>
  );
}

function ToastList() {
  const { toasts } = Toast.useToast();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      data-position="top"
      swipeDirection="up"
      // prettier-ignore
      className="
        absolute left-0 right-0 mx-auto
        bg-gray-50 p-4
        bg-clip-padding
        w-[300px]
        shadow-lg
        rounded-lg
        select-none
        border border-gray-200
        z-[calc(1000-var(--toast-index))]
        transition-all [transition-property:opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
        data-[ending-style]:opacity-0

        after:content-[''] after:absolute after:left-0 after:w-full after:h-[calc(var(--gap)+1px)]
        data-[position^=top]:after:top-full
        data-[position^=bottom]:after:bottom-full

        data-[position^=bottom]:bottom-0

        data-[position$=left]:right-auto data-[position$=left]:ml-0
        data-[position$=right]:left-auto data-[position$=right]:mr-0

        data-[position^=top]:data-[expanded]:[transform:translateX(var(--toast-swipe-move-x))_translateY(calc(var(--toast-offset)+calc(var(--toast-index)*var(--gap))+var(--toast-swipe-move-y)))]
        data-[position^=bottom]:data-[expanded]:[transform:translateX(var(--toast-swipe-move-x))_translateY(calc(var(--toast-offset)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-move-y)))]

        data-[position^=top]:[transform:translateX(var(--toast-swipe-move-x))_translateY(calc(var(--toast-swipe-move-y)+calc(var(--toast-index)*15px)))_scale(calc(1-(var(--toast-index)*0.1)))]
        data-[position^=bottom]:[transform:translateX(var(--toast-swipe-move-x))_translateY(calc(var(--toast-swipe-move-y)+calc(var(--toast-index)*-15px)))_scale(calc(1-(var(--toast-index)*0.1)))]

        data-[position^=top]:data-[starting-style]:[transform:translateY(-150%)]
        data-[position^=bottom]:data-[ending-style]:[not([data-limited])]:[transform:translateY(-150%)]
        data-[position^=top]:data-[expanded]:data-[ending-style]:[transform:translateY(-150%)]

        data-[position^=bottom]:data-[starting-style]:[transform:translateY(150%)]
        data-[position^=bottom]:data-[ending-style]:[not([data-limited])]:[transform:translateY(150%)]
        data-[position^=bottom]:data-[expanded]:data-[ending-style]:[transform:translateY(150%)]

        data-[position^=top]:data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-move-y)-150%))]
        data-[position^=top]:data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-move-x)-150%))]
        data-[position^=top]:data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-move-x)+150%))]
        data-[position^=top]:data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-move-y)+150%))]

        data-[position^=bottom]:data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-move-y)-150%))]
        data-[position^=bottom]:data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-move-x)-150%))]
        data-[position^=bottom]:data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-move-x)+150%))]
        data-[position^=bottom]:data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-move-y)+150%))]
      "
      style={{ '--gap': '10px' } as React.CSSProperties}
    >
      <Toast.Title className="text-[0.975rem] leading-5 font-medium">
        {toast.title}
      </Toast.Title>
      <Toast.Description className="text-[0.925rem] leading-5 text-gray-700">
        {toast.description}
      </Toast.Description>
      <Toast.Close
        className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded border-none bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Close"
      >
        <XIcon className="h-4 w-4" />
      </Toast.Close>
    </Toast.Root>
  ));
}

function XIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
