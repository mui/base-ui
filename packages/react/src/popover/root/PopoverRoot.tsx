'use client';
import * as React from 'react';
import { fastComponent } from '@base-ui/utils/fastHooks';
import { useDismiss } from '../../utils/popups/interactions/useDismiss';
import { getModalOutsidePressEvent } from '../../utils/popups/interactions/popupDismissal';
import {
  FloatingTree,
  useFloatingNodeId,
  useFloatingTree,
} from '../../utils/popups/tree/FloatingTree';
import {
  PopoverRootContext,
  PopoverTreeNodeContext,
  usePopoverRootContext,
} from './PopoverRootContext';
import { PopoverStore } from '../store/PopoverStore';
import type { PopoverHandle } from '../store/PopoverHandle';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';
import {
  renderPopupRootChildren,
  usePopupRoot,
  usePopupInteractionProps,
  usePopupRootSync,
} from '../../utils/popups';
import type { PayloadChildRenderFunction } from '../../utils/popups';

const PopoverRootComponent = fastComponent(function PopoverRootComponent<Payload>({
  props,
}: {
  props: PopoverRoot.Props<Payload>;
}) {
  const { children, modal = false, handle } = props;

  const { store, open, mounted, payload } = usePopupRoot(
    props,
    (initialState, floatingId, nested) =>
      new PopoverStore<Payload>({ ...initialState, modal }, floatingId, nested),
  );

  // Dispose the patient-click timeout held in the store's context on unmount.
  React.useEffect(() => store.context.stickIfOpenTimeout.disposeEffect(), [store]);

  usePopupRootSync(store, open);

  store.useSyncedValues({
    modal,
  });

  React.useEffect(() => {
    if (!open) {
      store.context.stickIfOpenTimeout.clear();
    }
  }, [store, open]);

  // Detached triggers share this one Root, so mounting its interactions eagerly is cheap. The
  // trigger props they publish then stay stable, so opening and closing doesn't re-render inactive
  // triggers.
  const shouldRenderInteractions = open || mounted || handle != null;

  const treeNodeId = useFloatingNodeId();
  const tree = useFloatingTree();
  const treeNode = React.useMemo(() => ({ id: treeNodeId, tree }), [treeNodeId, tree]);

  return (
    <PopoverRootContext.Provider value={store as PopoverRootContext<unknown>}>
      <PopoverTreeNodeContext.Provider value={treeNode}>
        {renderPopupRootChildren({
          store,
          handle,
          interactions: shouldRenderInteractions && (
            <PopoverInteractions store={store} modal={modal} />
          ),
          children,
          payload,
        })}
      </PopoverTreeNodeContext.Provider>
    </PopoverRootContext.Provider>
  );
});

/**
 * Groups all parts of the popover.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverRoot<Payload = unknown>(props: PopoverRoot.Props<Payload>) {
  if (usePopoverRootContext(true)) {
    return <PopoverRootComponent props={props} />;
  }

  return (
    <FloatingTree>
      <PopoverRootComponent props={props} />
    </FloatingTree>
  );
}

export interface PopoverRootState {}

export interface PopoverRootProps<Payload = unknown> {
  /**
   * Whether the popover is initially open.
   *
   * To render a controlled popover, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Whether the popover is currently open.
   */
  open?: boolean | undefined;
  /**
   * Event handler called when the popover is opened or closed.
   */
  onOpenChange?:
    ((open: boolean, eventDetails: PopoverRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Event handler called after any animations complete when the popover is opened or closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: Ends the closing phase of the popover after an externally controlled closing animation finishes.
   * Call `preventUnmountOnClose()` in `onOpenChange` first, otherwise the popover completes closing on its own.
   * Whether it leaves the DOM is decided by `keepMounted` on the portal.
   * - `close`: Closes the popover imperatively when called.
   */
  actionsRef?: React.RefObject<PopoverRoot.Actions | null> | undefined;
  /**
   * Determines if the popover enters a modal state when open.
   * - `true`: user interaction is limited to the popover: document page scroll is locked, and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * - `'trap-focus'`: focus is trapped inside the popover, but document page scroll is not locked and pointer interactions outside of it remain enabled.
   *
   * On touch devices, a `true` modal blocks outside taps but leaves the page scrollable unless the popup spans nearly the full viewport width, matching native iOS behavior.
   *
   * When `modal` is `true`, focus trapping is enabled only if `<Popover.Close>` is rendered
   * inside `<Popover.Popup>`. It can be visually hidden with your own CSS if needed, such as
   * Tailwind's `sr-only` utility.
   *
   * When `modal` is `'trap-focus'`, render `<Popover.Close>` inside `<Popover.Popup>` so touch
   * screen readers can escape the popup.
   * @default false
   */
  modal?: boolean | 'trap-focus' | undefined;
  /**
   * ID of the trigger that the popover is associated with.
   * This is useful in conjunction with the `open` prop to create a controlled popover.
   * There's no need to specify this prop when the popover is uncontrolled (that is, when the `open` prop is not set).
   */
  triggerId?: string | null | undefined;
  /**
   * ID of the trigger that the popover is associated with.
   * This is useful in conjunction with the `defaultOpen` prop to create an initially open popover.
   */
  defaultTriggerId?: string | null | undefined;
  /**
   * A handle to associate the popover with a trigger.
   * If specified, allows external triggers to control the popover's open state.
   */
  handle?: PopoverHandle<Payload> | undefined;
  /**
   * The content of the popover.
   * This can be a regular React node or a render function that receives the `payload` of the active trigger.
   */
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
}

export interface PopoverRootActions {
  unmount: () => void;
  close: () => void;
}

export type PopoverRootChangeEventReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.closePress
  | typeof REASONS.focusOut
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;
export type PopoverRootChangeEventDetails =
  BaseUIChangeEventDetails<PopoverRoot.ChangeEventReason> & {
    /** Prevents the popup from unmounting until the `unmount` action is called. */
    preventUnmountOnClose: () => void;
  };

export namespace PopoverRoot {
  export type State = PopoverRootState;
  export type Props<Payload = unknown> = PopoverRootProps<Payload>;
  export type Actions = PopoverRootActions;
  export type ChangeEventReason = PopoverRootChangeEventReason;
  export type ChangeEventDetails = PopoverRootChangeEventDetails;
}

function PopoverInteractions({
  store,
  modal,
}: {
  store: PopoverStore<any>;
  modal: boolean | 'trap-focus';
}) {
  const dismiss = useDismiss(store, {
    outsidePressEvent: getModalOutsidePressEvent(modal),
  });

  // `useDismiss` is not given an `enabled` option, so it always returns both prop bags. Restore
  // the `EMPTY_OBJECT` fallbacks if that ever changes: the store fields are non-optional.
  // `dismiss.trigger` is always the same object as `dismiss.reference`.
  const triggerProps = dismiss.reference!;
  // PopoverPopup already spreads `FOCUSABLE_POPUP_PROPS` directly, so the popup
  // props only need to carry the dismiss handlers.
  const popupProps = dismiss.floating!;

  usePopupInteractionProps(store, {
    activeTriggerProps: triggerProps,
    inactiveTriggerProps: triggerProps,
    popupProps,
  });

  return null;
}
