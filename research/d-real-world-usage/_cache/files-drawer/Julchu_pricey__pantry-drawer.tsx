"use client";

import { Drawer } from "@base-ui/react/drawer";
import { usePantryStore } from "@/providers/pantry-store-provider";
import { useShallow } from "zustand/react/shallow";
import { FormProvider, useForm } from "react-hook-form";
import { PantryFormData } from "@/utils/interfaces";
import { PantryContent } from "@/components/pantry/pantry-content";

export const pantryHandle = Drawer.createHandle();

export const PantryDrawer = () => {
  const { pantryIngredients } = usePantryStore(
    useShallow(({ pantryIngredients }) => ({ pantryIngredients })),
  );

  const methods = useForm<PantryFormData>({
    defaultValues: { ingredients: pantryIngredients },
  });

  return (
    <FormProvider {...methods}>
      <Drawer.Root
        handle={pantryHandle}
        swipeDirection={"right"}
        onOpenChange={(open) => {
          if (open) methods.reset({ ingredients: pantryIngredients });
        }}
      >
        <Drawer.SwipeArea className="absolute inset-y-0 right-0 z-999 w-5 sm:w-10 dark:border-blue-500 dark:bg-blue-500/10" />

        {/* TODO: check if portal remaining mounted has any performance improvements */}
        <Drawer.Portal>
          <Drawer.Backdrop
            className={
              "fixed inset-0 min-h-dvh bg-black opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))] transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] [--backdrop-opacity:0.2] [--bleed:3rem] data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:opacity-0 data-swiping:duration-0 supports-[-webkit-touch-callout:none]:absolute dark:[--backdrop-opacity:0.7]"
            }
          />
          <Drawer.Viewport
            className={
              "fixed inset-0 flex items-stretch justify-end p-(--viewport-padding) [--viewport-padding:0px] supports-[-webkit-touch-callout:none]:[--viewport-padding:0.625rem]"
            }
          >
            <Drawer.Popup
              className={
                "h-full w-full [transform:translateX(var(--drawer-swipe-movement-x))] touch-auto overflow-y-auto overscroll-contain bg-white text-neutral-950 shadow-[0.25rem_0.25rem_0] shadow-black/12 transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] outline-none [--bleed:3rem] data-ending-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:[transform:translateX(calc(100%-var(--bleed)+var(--viewport-padding)+2px))] data-swiping:select-none supports-[-webkit-touch-callout:none]:mr-0 supports-[-webkit-touch-callout:none]:w-[20rem] supports-[-webkit-touch-callout:none]:max-w-[calc(100vw-3rem)] supports-[-webkit-touch-callout:none]:border supports-[-webkit-touch-callout:none]:pr-6 supports-[-webkit-touch-callout:none]:[--bleed:0px] sm:w-4/5 dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none"
              }
            >
              <PantryContent />
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </FormProvider>
  );
};