'use client';
import * as React from 'react';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { FloatingFocusManager, useHoverFloatingInteraction } from '../../floating-ui-react';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { MenuRoot } from '../root/MenuRoot';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useToolbarRootContext } from '../../toolbar/root/ToolbarRootContext';
import { COMPOSITE_KEYS } from '../../composite/composite';
import { getDisabledMountTransitionStyles } from '../../utils/getDisabledMountTransitionStyles';

const stateAttributesMapping: StateAttributesMapping<MenuPopupState> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the menu items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuPopup = React.forwardRef(function MenuPopup(
  componentProps: MenuPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, finalFocus, ...elementProps } = componentProps;

  const { store } = useMenuRootContext();
  const { side, align, deferEnterTransition } = useMenuPositionerContext();
  const insideToolbar = useToolbarRootContext(true) != null;

  const open = store.useState('open');
  const transitionStatus = store.useState('transitionStatus');
  const popupProps = store.useState('popupProps');
  const mounted = store.useState('mounted');
  const instantType = store.useState('instantType');
  const triggerElement = store.useState('activeTriggerElement');
  const parent = store.useState('parent');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const rootId = store.useState('rootId');
  const floatingContext = store.useState('floatingRootContext');
  const floatingTreeRoot = store.useState('floatingTreeRoot');
  const closeDelay = store.useState('closeDelay');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const replayEnterTransitionFrame = useAnimationFrame();
  const [replayDeferredEnterTransition, setReplayDeferredEnterTransition] = React.useState(false);
  const deferredEnterTransitionRef = React.useRef(deferEnterTransition);

  const isContextMenu = parent.type === 'context-menu';

  useIsoLayoutEffect(() => {
    // If the submenu stayed hidden while its parent finished opening, re-apply the enter-only
    // transition hook on the reveal frame so the popup still animates into its corrected position.
    if (!open || transitionStatus === 'ending') {
      replayEnterTransitionFrame.cancel();
      deferredEnterTransitionRef.current = deferEnterTransition;
      setReplayDeferredEnterTransition(false);
      return undefined;
    }

    if (deferEnterTransition) {
      replayEnterTransitionFrame.cancel();
      deferredEnterTransitionRef.current = true;
      setReplayDeferredEnterTransition(false);
      return undefined;
    }

    if (!deferredEnterTransitionRef.current) {
      return undefined;
    }

    deferredEnterTransitionRef.current = false;
    setReplayDeferredEnterTransition(true);

    replayEnterTransitionFrame.request(() => {
      setReplayDeferredEnterTransition(false);
    });

    return () => {
      replayEnterTransitionFrame.cancel();
    };
  }, [deferEnterTransition, open, replayEnterTransitionFrame, transitionStatus]);

  let effectiveTransitionStatus = transitionStatus;
  // Hide the original "starting" phase while the submenu itself is hidden, then replay a fresh
  // enter phase on reveal so the popup still animates once the corrected position is ready.
  if (deferEnterTransition && transitionStatus === 'starting') {
    effectiveTransitionStatus = undefined;
  }
  if (replayDeferredEnterTransition) {
    effectiveTransitionStatus = 'starting';
  }

  useOpenChangeComplete({
    // While a hidden submenu is deferring its reveal, its real open transition has not completed
    // from the user's perspective. Wait until the replayed enter transition runs before reporting
    // completion so deeper nested menus can use the same parent-ready signal.
    enabled: !deferEnterTransition,
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.set('openTransitionComplete', true);
        store.context.onOpenChangeComplete?.(true);
      }
    },
  });

  React.useEffect(() => {
    function handleClose(event: {
      domEvent: Event | undefined;
      reason: MenuRoot.ChangeEventReason;
    }) {
      store.setOpen(false, createChangeEventDetails(event.reason, event.domEvent));
    }

    floatingTreeRoot.events.on('close', handleClose);

    return () => {
      floatingTreeRoot.events.off('close', handleClose);
    };
  }, [floatingTreeRoot.events, store]);

  const hoverEnabled = store.useState('hoverEnabled');
  const disabled = store.useState('disabled');

  useHoverFloatingInteraction(floatingContext, {
    enabled: hoverEnabled && !disabled && !isContextMenu && parent.type !== 'menubar',
    closeDelay,
  });

  const state: MenuPopupState = {
    transitionStatus: effectiveTransitionStatus,
    side,
    align,
    open,
    nested: parent.type === 'menu',
    instant: instantType,
  };

  const setPopupElement = React.useCallback(
    (element: HTMLElement | null) => {
      store.set('popupElement', element);
    },
    [store],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef, setPopupElement],
    stateAttributesMapping,
    props: [
      popupProps,
      {
        onKeyDown(event) {
          if (insideToolbar && COMPOSITE_KEYS.has(event.key)) {
            event.stopPropagation();
          }
        },
      },
      getDisabledMountTransitionStyles(effectiveTransitionStatus),
      elementProps,
      { 'data-rootownerid': rootId } as Record<string, string>,
    ],
  });

  let returnFocus = parent.type === undefined || isContextMenu;
  if (
    triggerElement ||
    (parent.type === 'menubar' && lastOpenChangeReason !== REASONS.outsidePress)
  ) {
    returnFocus = true;
  }

  return (
    <FloatingFocusManager
      context={floatingContext}
      modal={isContextMenu}
      disabled={!mounted}
      returnFocus={finalFocus === undefined ? returnFocus : finalFocus}
      initialFocus={parent.type !== 'menu'}
      restoreFocus
      externalTree={parent.type !== 'menubar' ? floatingTreeRoot : undefined}
      previousFocusableElement={activeTriggerElement as HTMLElement | null}
      nextFocusableElement={
        parent.type === undefined ? store.context.triggerFocusTargetRef : undefined
      }
      beforeContentFocusGuardRef={
        parent.type === undefined ? store.context.beforeContentFocusGuardRef : undefined
      }
    >
      {element}
    </FloatingFocusManager>
  );
});

export interface MenuPopupProps extends BaseUIComponentProps<'div', MenuPopupState> {
  children?: React.ReactNode;
  /**
   * @ignore
   */
  id?: string | undefined;
  /**
   * Determines the element to focus when the menu is closed.
   *
   * - `false`: Do not move focus.
   * - `true`: Move focus based on the default behavior (trigger or previously focused element).
   * - `RefObject`: Move focus to the ref element.
   * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
   *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
   */
  finalFocus?:
    | boolean
    | React.RefObject<HTMLElement | null>
    | ((closeType: InteractionType) => boolean | HTMLElement | null | void)
    | undefined;
}

export interface MenuPopupState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the menu is currently open.
   */
  open: boolean;
  /**
   * Whether the component is nested.
   */
  nested: boolean;
  /**
   * Whether transitions should be skipped.
   */
  instant: 'dismiss' | 'click' | 'group' | 'trigger-change' | undefined;
}

export namespace MenuPopup {
  export type Props = MenuPopupProps;
  export type State = MenuPopupState;
}
