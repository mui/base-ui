import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import * as React from "react";

import {
  Dialog,
  DialogPopup,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/registry/pure-ui/ui/dialog";
import { Button } from "@/registry/pure-ui/ui/button";

const demoDialog = DialogPrimitive.createHandle();

export const DetachedTriggerDialogSimpleDemo = () => {
  return (
    <React.Fragment>
      <DialogTrigger handle={demoDialog} render={<Button variant="outline" />}>
        View notifications
      </DialogTrigger>

      <Dialog handle={demoDialog}>
        <DialogPopup className="sm:max-w-sm">
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>
            You are all caught up. Good job!
          </DialogDescription>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>Close</DialogClose>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </React.Fragment>
  );
};
