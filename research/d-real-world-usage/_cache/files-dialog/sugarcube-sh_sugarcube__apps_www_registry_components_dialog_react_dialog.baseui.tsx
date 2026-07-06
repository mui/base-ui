"use client";

import { Dialog as DialogPrimitive } from "@base-ui-components/react/dialog";
import cn from "clsx";
import type * as React from "react";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return <DialogPrimitive.Root {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
    return <DialogPrimitive.Trigger {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal {...props} />;
}

function DialogClose({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return <DialogPrimitive.Close className={cn("button", className)} {...props} />;
}

function DialogBackdrop({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
    return <DialogPrimitive.Backdrop className={cn("dialog-backdrop", className)} {...props} />;
}

function DialogContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup>) {
    return (
        <DialogPortal>
            <DialogBackdrop />
            <DialogPrimitive.Popup className={cn("dialog", className)} {...props}>
                {children}
            </DialogPrimitive.Popup>
        </DialogPortal>
    );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return <DialogPrimitive.Title className={cn("dialog-title", className)} {...props} />;
}

function DialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description className={cn("dialog-description", className)} {...props} />
    );
}

export {
    Dialog,
    DialogTrigger,
    DialogPortal,
    DialogBackdrop,
    DialogContent,
    DialogClose,
    DialogTitle,
    DialogDescription,
};
