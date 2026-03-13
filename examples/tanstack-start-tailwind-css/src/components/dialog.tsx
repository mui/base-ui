import clsx from 'clsx';
import { Dialog } from '@base-ui/react/dialog';

export function Root(props: Dialog.Root.Props) {
  return <Dialog.Root {...props} />;
}

export function Trigger({ className, ...props }: Dialog.Trigger.Props) {
  return (
    <Dialog.Trigger
      className={clsx(
        'flex h-10 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100 data-[popup-open]:bg-gray-100',
        className,
      )}
      {...props}
    />
  );
}

export function Portal(props: Dialog.Portal.Props) {
  return <Dialog.Portal {...props} />;
}

export function Backdrop({ className, ...props }: Dialog.Backdrop.Props) {
  return (
    <Dialog.Backdrop
      className={clsx(
        'fixed inset-0 min-h-dvh bg-black opacity-20 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute',
        className,
      )}
      {...props}
    />
  );
}

export function Popup({ className, ...props }: Dialog.Popup.Props) {
  return (
    <Dialog.Popup
      className={clsx(
        'fixed top-[calc(50%+1.25rem*var(--nested-dialogs))] left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 scale-[calc(1-0.1*var(--nested-dialogs))] rounded-lg bg-gray-50 p-6 text-gray-900 outline-1 outline-gray-200 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[nested-dialog-open]:after:absolute data-[nested-dialog-open]:after:inset-0 data-[nested-dialog-open]:after:rounded-[inherit] data-[nested-dialog-open]:after:bg-black/5 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:outline-gray-300',
        className,
      )}
      {...props}
    />
  );
}

export function Title({ className, ...props }: Dialog.Title.Props) {
  return (
    <Dialog.Title className={clsx('-mt-1.5 mb-1 text-lg font-medium', className)} {...props} />
  );
}

export function Close({ className, ...props }: Dialog.Close.Props) {
  return (
    <Dialog.Close
      className={clsx(
        'flex h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 select-none hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100',
        className,
      )}
      {...props}
    />
  );
}
