"use client";

import { createContext, useContext, useMemo } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/classes";

const cssAnimationPresets = {
  none: "transition-none",
  scale: [
    `[transition-property:scale,opacity,translate] [will-change:scale,opacity,translate]`,
    `data-starting-style:opacity-0 data-ending-style:opacity-0 max-sm:opacity-[calc(1-min(var(--nested-dialogs),1))] max-sm:data-starting-style:translate-y-4 max-sm:data-ending-style:translate-y-4 max-sm:data-starting-style:scale-98 max-sm:data-ending-style:scale-98 max-sm:origin-bottom`,
    `sm:-translate-y-[calc(2rem*var(--nested-dialogs))] sm:scale-[calc(1-0.1*var(--nested-dialogs))] sm:data-starting-style:scale-98 sm:data-ending-style:scale-98 sm:data-nested:data-ending-style:translate-y-8 sm:data-nested:data-starting-style:translate-y-8`,
  ],
  fade: [
    `[transition-property:opacity,translate,scale] [will-change:opacity,translate,scale]`,
    `data-starting-style:opacity-0 data-ending-style:opacity-0 max-sm:opacity-[calc(1-min(var(--nested-dialogs),1))] max-sm:data-starting-style:translate-y-4 max-sm:data-ending-style:translate-y-4`,
    `sm:-translate-y-[calc(2rem*var(--nested-dialogs))] sm:scale-[calc(1-0.1*var(--nested-dialogs))]`,
  ],
  topFlip: [
    `[transition-property:opacity,filter,transform,translate,scale] [will-change:opacity,filter,transform,translate,scale]`,
    `data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:blur-[4px] data-ending-style:blur-[4px] data-starting-style:transform-[perspective(1000px)_rotateX(50deg)_scale(0.8)] data-ending-style:transform-[perspective(1000px)_rotateX(50deg)_scale(0.8)]`,
    `sm:translate-y-[calc(3.5rem*var(--nested-dialogs))] sm:scale-[calc(1-0.1*var(--nested-dialogs))]`,
  ],
  bottomFlip: [
    `[transition-property:opacity,filter,transform,translate,scale] [will-change:opacity,filter,transform,translate,scale]`,
    `data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:blur-[4px] data-ending-style:blur-[4px] data-starting-style:transform-[perspective(1000px)_rotateX(-50deg)_scale(0.8)] data-ending-style:transform-[perspective(1000px)_rotateX(-50deg)_scale(0.8)]`,
    `sm:-translate-y-[calc(2rem*var(--nested-dialogs))] sm:scale-[calc(1-0.1*var(--nested-dialogs))]`,
  ],
  rightFlip: [
    `[transition-property:opacity,filter,transform,translate,scale] [will-change:opacity,filter,transform,translate,scale]`,
    `data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:blur-[4px] data-ending-style:blur-[4px] data-starting-style:transform-[perspective(1000px)_rotateY(50deg)_scale(0.8)] data-ending-style:transform-[perspective(1000px)_rotateY(50deg)_scale(0.8)]`,
    `sm:-translate-x-[calc(2.5rem*var(--nested-dialogs))] sm:scale-[calc(1-0.1*var(--nested-dialogs))]`,
  ],
  leftFlip: [
    `[transition-property:opacity,filter,transform,translate,scale] [will-change:opacity,filter,transform,translate,scale]`,
    `data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:blur-[4px] data-ending-style:blur-[4px] data-starting-style:transform-[perspective(1000px)_rotateY(-50deg)_scale(0.8)] data-ending-style:transform-[perspective(1000px)_rotateY(-50deg)_scale(0.8)]`,
    `sm:translate-x-[calc(2.5rem*var(--nested-dialogs))] sm:scale-[calc(1-0.1*var(--nested-dialogs))]`,
  ],
  topSlide: [
    `[transition-property:opacity,transform,translate,scale] [will-change:opacity,transform,translate,scale]`,
    `data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:translate-y-[-20px] data-ending-style:translate-y-[-20px] max-sm:data-starting-style:-translate-y-4 max-sm:data-ending-style:-translate-y-4`,
    `sm:translate-y-[calc(3.5rem*var(--nested-dialogs))] sm:scale-[calc(1-0.1*var(--nested-dialogs))]`,
  ],
  bottomSlide: [
    `[transition-property:opacity,transform,translate,scale] [will-change:opacity,transform,translate,scale]`,
    `data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:translate-y-[20px] data-ending-style:translate-y-[20px] max-sm:data-starting-style:translate-y-4 max-sm:data-ending-style:translate-y-4`,
    `sm:-translate-y-[calc(2rem*var(--nested-dialogs))] sm:scale-[calc(1-0.1*var(--nested-dialogs))]`,
  ],
  leftSlide: [
    `[transition-property:opacity,transform,translate,scale] [will-change:opacity,transform,translate,scale]`,
    `data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:translate-x-[-20px] data-ending-style:translate-x-[-20px] max-sm:data-starting-style:-translate-x-4 max-sm:data-ending-style:-translate-x-4`,
    `sm:translate-x-[calc(2.5rem*var(--nested-dialogs))] sm:scale-[calc(1-0.1*var(--nested-dialogs))]`,
  ],
  rightSlide: [
    `[transition-property:opacity,transform,translate,scale] [will-change:opacity,transform,translate,scale]`,
    `data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:translate-x-[20px] data-ending-style:translate-x-[20px] max-sm:data-starting-style:translate-x-4 max-sm:data-ending-style:translate-x-4`,
    `sm:-translate-x-[calc(2.5rem*var(--nested-dialogs))] sm:scale-[calc(1-0.1*var(--nested-dialogs))]`,
  ],
  wipe: [
    `[transition-property:clip-path,translate,scale] [will-change:clip-path,translate,scale] [clip-path:inset(0_0_0_0_round_12px)] [-webkit-clip-path:inset(0_0_0_0_round_12px)]`,
    `data-starting-style:[clip-path:inset(0_0_100%_0_round_12px)] data-ending-style:[clip-path:inset(0_0_100%_0_round_12px)]`,
    `sm:-translate-y-[calc(2rem*var(--nested-dialogs))] sm:scale-[calc(1-0.1*var(--nested-dialogs))]`,
  ],
};

const cssTransitionPresets = {
  inExpo: `duration-[0.35s] ease-[cubic-bezier(0.95,0.05,0.795,0.035)]`,
  outExpo: `duration-[0.35s] ease-[cubic-bezier(0.19,1,0.22,1)]`,
  inOutExpo: `duration-[0.35s] ease-[cubic-bezier(1,0,0,1)]`,
  anticipate: `duration-[0.35s] ease-[cubic-bezier(1,-0.4,0.35,0.95)]`,
  quickOut: `duration-[0.35s] ease-out`,
  overshootOut: `duration-[0.35s] ease-[cubic-bezier(0.175,0.885,0.32,1.275)]`,
  swiftOut: `duration-[0.35s] ease-[cubic-bezier(0.175,0.885,0.32,1.1)]`,
  snappyOut: `duration-[0.35s] ease-[cubic-bezier(0.19,1,0.22,1)]`,
  in: `duration-[0.35s] ease-[cubic-bezier(0.42,0,1,1)]`,
  out: `duration-[0.35s] ease-[cubic-bezier(0,0,0.58,1)]`,
  inOut: `duration-[0.25s] ease-[cubic-bezier(0.42,0,0.58,1)]`,
  outIn: `duration-[0.35s] ease-[cubic-bezier(0.1,0.7,0.9,0.5)]`,
  inQuad: `duration-[0.35s] ease-[cubic-bezier(0.55,0.085,0.68,0.53)]`,
  outQuad: `duration-[0.25s] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`,
  inOutQuad: `duration-[0.32s] ease-[cubic-bezier(0.455,0.03,0.515,0.955)]`,
  inCubic: `duration-[0.35s] ease-[cubic-bezier(0.55,0.055,0.675,0.19)]`,
  outCubic: `duration-[0.35s] ease-[cubic-bezier(0.215,0.61,0.355,1)]`,
  inOutCubic: `duration-[0.35s] ease-[cubic-bezier(0.645,0.045,0.355,1)]`,
  inQuart: `duration-[0.35s] ease-[cubic-bezier(0.895,0.03,0.685,0.22)]`,
  outQuart: `duration-[0.35s] ease-[cubic-bezier(0.165,0.84,0.44,1)]`,
  inOutQuart: `duration-[0.35s] ease-[cubic-bezier(0.77,0,0.175,1)]`,
  inQuint: `duration-[0.35s] ease-[cubic-bezier(0.755,0.05,0.855,0.06)]`,
  outQuint: `duration-[0.35s] ease-[cubic-bezier(0.23,1,0.32,1)]`,
  inOutQuint: `duration-[0.35s] ease-[cubic-bezier(0.86,0,0.07,1)]`,
  inCirc: `duration-[0.35s] ease-[cubic-bezier(0.6,0.04,0.98,0.335)]`,
  outCirc: `duration-[0.35s] ease-[cubic-bezier(0.075,0.82,0.165,1)]`,
  inOutCirc: `duration-[0.35s] ease-[cubic-bezier(0.785,0.135,0.15,0.86)]`,
  inOutBase: `duration-[0.35s] ease-[cubic-bezier(0.25,0.1,0.25,1)]`,
};

type CSSAnimationPresets = keyof typeof cssAnimationPresets;
type CSSTransitionPresets = keyof typeof cssTransitionPresets;

interface DialogContextType {
  modal: DialogProps<unknown>["modal"];
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

interface DialogProps<TPayload = unknown>
  extends DialogPrimitive.Root.Props<TPayload> {}

function Dialog<TPayload = unknown>({
  modal = true,
  ...props
}: DialogProps<TPayload>) {
  return (
    <DialogContext.Provider value={{ modal }}>
      <DialogPrimitive.Root data-slot="dialog" modal={modal} {...props} />
    </DialogContext.Provider>
  );
}

interface DialogTriggerProps extends DialogPrimitive.Trigger.Props {}

function DialogTrigger({ ...props }: DialogTriggerProps) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

interface DialogViewportProps extends DialogPrimitive.Viewport.Props {}

function DialogViewport({ ...props }: DialogViewportProps) {
  return <DialogPrimitive.Viewport data-slot="dialog-viewport" {...props} />;
}

interface DialogPortalProps extends DialogPrimitive.Portal.Props {}

function DialogPortal(props: DialogPortalProps) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

interface DialogBackdropProps extends DialogPrimitive.Backdrop.Props {}

function DialogBackdrop({ className, ...props }: DialogBackdropProps) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      render={
        <div
          key="dialog-backdrop"
          className={cn(
            "fixed inset-0 bg-black/32 backdrop-blur-sm z-50 transition-all duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-[-webkit-touch-callout:none]:absolute",
            className
          )}
        />
      }
      {...props}
    />
  );
}

interface DialogPopupProps extends DialogPrimitive.Popup.Props {
  animationPreset?: CSSAnimationPresets;
  transitionPreset?: CSSTransitionPresets;
  reduceMotion?: boolean;
  showCloseButton?: boolean;
}

function DialogPopup({
  className,
  animationPreset = "scale",
  transitionPreset = "outCubic",
  children,
  reduceMotion = false,
  showCloseButton = true,
  ...rest
}: DialogPopupProps) {
  const { modal } = useDialog();

  const cssAnimationConfig = useMemo(() => {
    if (reduceMotion) return "none";

    if (animationPreset) {
      return cssAnimationPresets[animationPreset];
    }

    return cssAnimationPresets.scale;
  }, [animationPreset, reduceMotion]);

  const cssTransitionConfig = useMemo(() => {
    if (reduceMotion) return "none";

    if (transitionPreset) {
      return cssTransitionPresets[transitionPreset];
    }

    return cssTransitionPresets.snappyOut;
  }, [transitionPreset, reduceMotion]);

  return (
    <DialogPortal>
      {modal && <DialogBackdrop />}
      <div className="fixed inset-0 z-50">
        <div className="flex h-dvh flex-col items-center overflow-hidden pt-6 max-sm:before:flex-1 sm:overflow-y-auto sm:p-4 sm:before:basis-[30vh] sm:after:flex-1">
          <DialogPrimitive.Popup
            data-slot="dialog-popup"
            render={
              <div
                key="dialog-popup"
                className={cn(
                  "relative row-start-2 grid w-full min-w-0 gap-4 border bg-popover p-6 text-popover-foreground shadow-lg",
                  "max-sm:overflow-y-auto max-sm:border-none sm:max-w-lg sm:rounded-2xl",
                  cssTransitionConfig,
                  cssAnimationConfig,
                  className
                )}
              >
                {children}
                {showCloseButton && (
                  <DialogPrimitive.Close
                    data-slot="dialog-close"
                    className="ring-offset-background focus:ring-ring data-open:bg-accent data-open:text-muted-foreground absolute top-4 right-4 rounded-full opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                  >
                    <XIcon />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>
                )}
              </div>
            }
            {...rest}
          />
        </div>
      </div>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:-mx-6 sm:mt-2 sm:-mb-6 sm:flex-row sm:justify-end sm:rounded-b-xl sm:border-t sm:border-border/60 sm:bg-muted/50 sm:px-6 sm:py-4",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

interface DialogCloseProps extends DialogPrimitive.Close.Props {}

function DialogClose(props: DialogCloseProps) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

export {
  Dialog,
  DialogClose,
  DialogPopup,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogBackdrop,
  DialogViewport,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
