import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import {
  type ComponentPropsWithoutRef,
  createContext,
  type ReactNode,
  use,
  useMemo,
} from "react";

import { useSearchParams } from "../useSearchParams";

export interface DialogIds {
  // use declaration merging to add dialog ids here like
  // "edit-event": true;
}

export type DialogId = keyof DialogIds;
export type DialogsOpenStates = Partial<Record<DialogId, boolean>>;
export interface DialogsContext {
  isOpen: (id: DialogId) => boolean;
  set: (id: DialogId, open: boolean) => void;
}
const context = createContext<DialogsContext>({
  isOpen: () => false,
  set: () => {
    throw new Error("useDialogs must be used within a DialogsProvider");
  },
});

export interface DialogRootProps extends Omit<
  ComponentPropsWithoutRef<typeof BaseDialog.Root>,
  "open"
> {
  id: DialogId;
}

export const Dialog = {
  ...BaseDialog,
  Root(props: DialogRootProps) {
    const ctx = use(context);

    return (
      <BaseDialog.Root
        {...props}
        open={ctx.isOpen(props.id)}
        onOpenChange={(open, event, reason) => {
          ctx.set(props.id, open);
          props.onOpenChange?.(open, event, reason);
        }}
      />
    );
  },
};

const { Provider } = context;

const SEARCH_PARAM_KEY = "d";

export function DialogsProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const openDialogs = searchParams.getAll(SEARCH_PARAM_KEY);

  return (
    <Provider
      value={useMemo(() => {
        return {
          isOpen: (id: DialogId) => openDialogs.includes(id),
          set: (id: DialogId, open: boolean) => {
            if (open) searchParams.append(SEARCH_PARAM_KEY, id);
            else searchParams.delete(SEARCH_PARAM_KEY, id);
          },
        };
      }, [searchParams.get(SEARCH_PARAM_KEY)])}
    >
      {children}
    </Provider>
  );
}

export function useDialogs() {
  return use(context);
}
