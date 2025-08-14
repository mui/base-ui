'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { FloatingFocusManager } from '../../floating-ui-react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { usePopupAutoResize } from '../../utils/usePopupAutoResize';

import { DISABLED_TRANSITIONS_STYLE, EMPTY_OBJECT } from '../../utils/constants';
import { selectors } from '../store';
import { useTimeout } from '@base-ui-components/utils/useTimeout';

const customStyleHookMapping: CustomStyleHookMapping<PopoverPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the popover contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverPopup = React.forwardRef(function PopoverPopup(
  componentProps: PopoverPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, initialFocus, finalFocus, ...elementProps } = componentProps;

  const { popupRef, onOpenChangeComplete, store } = usePopoverRootContext();

  const positioner = usePopoverPositionerContext();
  const open = useStore(store, selectors.open);
  const openMethod = useStore(store, selectors.openMethod);
  const instantType = useStore(store, selectors.instantType);
  const transitionStatus = useStore(store, selectors.transitionStatus);
  const popupProps = useStore(store, selectors.popupProps);
  const titleId = useStore(store, selectors.titleId);
  const descriptionId = useStore(store, selectors.descriptionId);
  const modal = useStore(store, selectors.modal);
  const mounted = useStore(store, selectors.mounted);
  const openReason = useStore(store, selectors.openReason);
  const popupElement = useStore(store, selectors.popupElement);
  const triggers = useStore(store, selectors.triggers);
  const payload = useStore(store, selectors.payload);

  useOpenChangeComplete({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const resolvedInitialFocus = React.useMemo(() => {
    if (initialFocus == null) {
      if (openMethod === 'touch') {
        return popupRef;
      }
      return 0;
    }

    if (typeof initialFocus === 'function') {
      return initialFocus(openMethod ?? '');
    }

    return initialFocus;
  }, [initialFocus, openMethod, popupRef]);

  const state: PopoverPopup.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      instant: instantType,
      transitionStatus,
    }),
    [open, positioner.side, positioner.align, instantType, transitionStatus],
  );

  const setPopupElement = React.useCallback(
    (element: HTMLElement | null) => {
      store.set('popupElement', element);
    },
    [store],
  );

  usePopupAutoResize({
    element: popupElement,
    open,
    content: payload,
    enabled: triggers.size > 1,
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, popupRef, setPopupElement],
    props: [
      popupProps,
      {
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId,
      },
      transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT,
      elementProps,
    ],
    customStyleHookMapping,
  });

  return (
    <FloatingFocusManager
      context={positioner.context}
      modal={modal === 'trap-focus'}
      disabled={!mounted || openReason === 'trigger-hover'}
      initialFocus={resolvedInitialFocus}
      returnFocus={finalFocus}
      closeOnFocusOut={false}
    >
      {element}
    </FloatingFocusManager>
  );
});

export namespace PopoverPopup {
  export interface State {
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Determines the element to focus when the popover is opened.
     * By default, the first focusable element is focused.
     */
    initialFocus?:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>);
    /**
     * Determines the element to focus when the popover is closed.
     * By default, focus returns to the trigger.
     */
    finalFocus?: React.RefObject<HTMLElement | null>;
  }
}

function usePrevious<T>(value: T): T | null {
  const ref = React.useRef<T | null>(null);
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export const PopoverTransitionContainer = React.forwardRef(function PopoverTransitionContainer(
  componentProps: PopoverTransitionContainer.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children, ...elementProps } = componentProps;
  const { store } = usePopoverRootContext();

  const activeTrigger = useStore(store, selectors.activeTriggerElement);
  const previousActiveTrigger = usePrevious(activeTrigger);

  const [previousChildren, setPreviousChildren] = React.useState<React.ReactNode>(null);
  const [newTriggerOffset, setNewTriggerOffset] = React.useState<Offset | null>(null);

  const prevChildren = usePrevious(children);

  const nextContainerRef = React.useRef<HTMLDivElement>(null);
  const onAnimationsFinished = useAnimationsFinished(nextContainerRef, true);
  const cleanupTimeout = useTimeout();

  React.useEffect(() => {
    if (activeTrigger && previousActiveTrigger && activeTrigger !== previousActiveTrigger) {
      setPreviousChildren(prevChildren);
      const offset = calculateRelativePosition(previousActiveTrigger, activeTrigger);
      setNewTriggerOffset(offset);
      cleanupTimeout.start(10, () => {
        onAnimationsFinished(() => setPreviousChildren(null));
      });
    }
  }, [activeTrigger, prevChildren, onAnimationsFinished, previousActiveTrigger, cleanupTimeout]);

  let childrenToRender: React.ReactNode;
  if (previousChildren == null) {
    childrenToRender = <div data-current>{children}</div>;
  } else {
    childrenToRender = (
      <React.Fragment>
        <div data-previous inert>
          {previousChildren}
        </div>
        <div data-next ref={nextContainerRef}>
          {children}
        </div>
      </React.Fragment>
    );
  }

  const state = React.useMemo(() => {
    return {
      activationDirection: getActivationDirection(newTriggerOffset),
    };
  }, [newTriggerOffset]);

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps, { children: childrenToRender }],
  });
});

export namespace PopoverTransitionContainer {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The content to render inside the transition container.
     */
    children?: React.ReactNode;
  }

  export interface State {
    activationDirection?: string;
  }
}

type Offset = {
  horizontal: number;
  vertical: number;
};

function getActivationDirection(offset: Offset | null): string | undefined {
  if (!offset) {
    return undefined;
  }

  return `${getValueWithTolerance(offset.horizontal, 5, 'right', 'left')} ${getValueWithTolerance(offset.vertical, 5, 'down', 'up')}`;
}

function getValueWithTolerance(
  value: number,
  tolerance: number,
  positiveLabel: string,
  negativeLabel: string,
) {
  if (value > tolerance) {
    return positiveLabel;
  }

  if (value < -tolerance) {
    return negativeLabel;
  }

  return '';
}

function calculateRelativePosition(from: HTMLElement, to: HTMLElement): Offset {
  const fromRect = from.getBoundingClientRect();
  const toRect = to.getBoundingClientRect();

  const fromCenter = {
    x: fromRect.left + fromRect.width / 2,
    y: fromRect.top + fromRect.height / 2,
  };
  const toCenter = {
    x: toRect.left + toRect.width / 2,
    y: toRect.top + toRect.height / 2,
  };

  return {
    horizontal: toCenter.x - fromCenter.x,
    vertical: toCenter.y - fromCenter.y,
  };
}
