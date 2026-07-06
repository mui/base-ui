import * as React from "react";
import clsx from "clsx";
import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import { Button } from "@/components/primitives/Button";
import { X as XIcon } from "lucide-react";

export function DialogBackdrop() {
  return (
    <BaseDialog.Backdrop
      className={clsx(
        "fixed inset-0 bg-black/20 dark:bg-zinc-900/10 transition-all duration-150",
        "backdrop-blur-xs",
        "data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
      )}
    />
  );
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return (
    <BaseDialog.Description className="text-sm default-p-color mb-2">
      {children}
    </BaseDialog.Description>
  );
}

export function DialogWrap({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <BaseDialog.Popup
      className={clsx(
        "fixed bottom-0 sm:top-1/2 left-1/2 -mt-8",
        "-translate-x-1/2 sm:-translate-y-1/2 rounded-b-none sm:rounded-b-lg rounded-t-lg",
        "w-full sm:w-[450px] h-fit overflow-clip",
        "bg-gray-50 text-gray-900",
        "dark:bg-neutral-950 text-gray-900",
        "border default-border-color",
        "outline-none shadow-2xl",
        "transition-all duration-100",
        "data-[ending-style]:scale-90 data-[ending-style]:opacity-0",
        "data-[starting-style]:scale-90 data-[starting-style]:opacity-0",
      )}
    >
      <div className="flex items-center justify-between pl-4 pr-2 py-2 border-b default-border-color">
        <BaseDialog.Title className="dark:text-white font-medium">
          {title}
        </BaseDialog.Title>
        <BaseDialog.Close
          render={
            <Button square aria-label="Close Button" variant="ghost">
              <XIcon size={14} />
            </Button>
          }
        />
      </div>
      <div className="grow flex flex-col p-4 gap-2 justify-between">
        {children}
      </div>
    </BaseDialog.Popup>
  );
}
