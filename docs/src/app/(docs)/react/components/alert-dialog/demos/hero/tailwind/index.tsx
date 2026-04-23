import { AlertDialog } from '@base-ui/react/alert-dialog';

const buttonClasses =
  'flex h-8 items-center justify-center bg-gray-200 dark:bg-gray-800 px-3.5 text-sm font-normal text-gray-900 dark:text-white select-none hover:bg-gray-300 dark:hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800';

const dangerButtonClasses = `${buttonClasses} text-red-700 dark:text-red-400`;

export default function ExampleAlertDialog() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger className={dangerButtonClasses}>Discard draft</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-[0.08] transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-950 p-3 text-gray-900 dark:text-white border border-gray-900 dark:border-white shadow-[4px_4px_0] shadow-black/12 dark:shadow-none transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0">
          <AlertDialog.Title className="text-sm font-bold">Discard draft?</AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-gray-600 dark:text-gray-400">
            You can’t undo this action.
          </AlertDialog.Description>
          <div className="flex justify-end gap-3 mt-4">
            <AlertDialog.Close className={buttonClasses}>Cancel</AlertDialog.Close>
            <AlertDialog.Close className={dangerButtonClasses}>Discard</AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
