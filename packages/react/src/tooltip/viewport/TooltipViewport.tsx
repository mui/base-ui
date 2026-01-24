'use client';
import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { usePreviousValue } from '@base-ui/utils/usePreviousValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext';
import { BaseUIComponentProps } from '../../utils/types';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { usePopupAutoResize } from '../../utils/usePopupAutoResize';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { Dimensions } from '../../floating-ui-react/types';
import { TooltipViewportCssVars } from './TooltipViewportCssVars';
import { useDirection } from '../../direction-provider';

const stateAttributesMapping: StateAttributesMapping<TooltipViewport.State> = {
  activationDirection: (value) =>
    value
      ? {
          'data-activation-direction': value,
        }
      : null,
};

/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content change based on the trigger
 * and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export const TooltipViewport = React.forwardRef(function TooltipViewport(
  componentProps: TooltipViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children, ...elementProps } = componentProps;
  const store = useTooltipRootContext();
  const positioner = useTooltipPositionerContext();
  const direction = useDirection();

  const activeTrigger = store.useState('activeTriggerElement');
  const open = store.useState('open');
  const instantType = store.useState('instantType');
  const mounted = store.useState('mounted');
  const payload = store.useState('payload');
  const popupElement = store.useState('popupElement');
  const positionerElement = store.useState('positionerElement');

  const previousActiveTrigger = usePreviousValue(open ? activeTrigger : null);

  const capturedNodeRef = React.useRef<HTMLElement | null>(null);
  const [previousContentNode, setPreviousContentNode] = React.useState<HTMLElement | null>(null);

  const [newTriggerOffset, setNewTriggerOffset] = React.useState<Offset | null>(null);

  const currentContainerRef = React.useRef<HTMLDivElement>(null);
  const previousContainerRef = React.useRef<HTMLDivElement>(null);

  const onAnimationsFinished = useAnimationsFinished(currentContainerRef, true, false);
  const cleanupFrame = useAnimationFrame();

  const [previousContentDimensions, setPreviousContentDimensions] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  const [showStartingStyleAttribute, setShowStartingStyleAttribute] = React.useState(false);

  useIsoLayoutEffect(() => {
    store.set('hasViewport', true);
    return () => {
      store.set('hasViewport', false);
    };
  }, [store]);

  const handleMeasureLayout = useStableCallback(() => {
    currentContainerRef.current?.style.setProperty('animation', 'none');
    currentContainerRef.current?.style.setProperty('transition', 'none');

    previousContainerRef.current?.style.setProperty('display', 'none');
  });

  const handleMeasureLayoutComplete = useStableCallback((previousDimensions: Dimensions | null) => {
    currentContainerRef.current?.style.removeProperty('animation');
    currentContainerRef.current?.style.removeProperty('transition');

    previousContainerRef.current?.style.removeProperty('display');

    if (previousDimensions) {
      setPreviousContentDimensions(previousDimensions);
    }
  });

  const lastHandledTriggerRef = React.useRef<Element | null>(null);

  useIsoLayoutEffect(() => {
    // When a trigger changes, set the captured children HTML to state,
    // so we can render both new and old content.
    if (
      activeTrigger &&
      previousActiveTrigger &&
      activeTrigger !== previousActiveTrigger &&
      lastHandledTriggerRef.current !== activeTrigger &&
      capturedNodeRef.current
    ) {
      setPreviousContentNode(capturedNodeRef.current);
      setShowStartingStyleAttribute(true);

      // Calculate the relative position between the previous and new trigger,
      // so we can pass it to the style hook for animation purposes.
      const offset = calculateRelativePosition(previousActiveTrigger, activeTrigger);
      setNewTriggerOffset(offset);

      cleanupFrame.request(() => {
        cleanupFrame.request(() => {
          setShowStartingStyleAttribute(false);
          onAnimationsFinished(() => {
            setPreviousContentNode(null);
            setPreviousContentDimensions(null);
            capturedNodeRef.current = null;
          });
        });
      });

      lastHandledTriggerRef.current = activeTrigger;
    }
  }, [
    activeTrigger,
    previousActiveTrigger,
    previousContentNode,
    onAnimationsFinished,
    cleanupFrame,
  ]);

  // Capture a clone of the current content DOM subtree when not transitioning.
  // We can't store previous React nodes as they may be stateful; instead we capture DOM clones for visual continuity.
  useIsoLayoutEffect(() => {
    // When a transition is in progress, we store the next content in capturedNodeRef.
    // This handles the case where the trigger changes multiple times before the transition finishes.
    // We want to always capture the latest content for the previous snapshot.
    // So clicking quickly on T1, T2, T3 will result in the following sequence:
    // 1. T1 -> T2: previousContent = T1, currentContent = T2
    // 2. T2 -> T3: previousContent = T2, currentContent = T3
    const source = currentContainerRef.current;
    if (!source) {
      return;
    }

    const wrapper = document.createElement('div');
    for (const child of Array.from(source.childNodes)) {
      wrapper.appendChild(child.cloneNode(true));
    }

    capturedNodeRef.current = wrapper;
  });

  const isTransitioning = previousContentNode != null;
  let childrenToRender: React.ReactNode;
  if (!isTransitioning) {
    childrenToRender = (
      <div data-current ref={currentContainerRef} key={'current'}>
        {children}
      </div>
    );
  } else {
    childrenToRender = (
      <React.Fragment>
        <div
          data-previous
          inert={inertValue(true)}
          ref={previousContainerRef}
          style={
            {
              [TooltipViewportCssVars.popupWidth]: `${previousContentDimensions?.width}px`,
              [TooltipViewportCssVars.popupHeight]: `${previousContentDimensions?.height}px`,
              position: 'absolute',
            } as React.CSSProperties
          }
          key={'previous'}
          data-ending-style={showStartingStyleAttribute ? undefined : ''}
        />
        <div
          data-current
          ref={currentContainerRef}
          key={'current'}
          data-starting-style={showStartingStyleAttribute ? '' : undefined}
        >
          {children}
        </div>
      </React.Fragment>
    );
  }

  // When previousContentNode is present, imperatively populate the previous container with the cloned children.
  useIsoLayoutEffect(() => {
    const container = previousContainerRef.current;
    if (!container || !previousContentNode) {
      return;
    }

    container.replaceChildren(...Array.from(previousContentNode.childNodes));
  }, [previousContentNode]);

  usePopupAutoResize({
    popupElement,
    positionerElement,
    mounted,
    content: payload,
    onMeasureLayout: handleMeasureLayout,
    onMeasureLayoutComplete: handleMeasureLayoutComplete,
    side: positioner.side,
    direction,
  });

  const state = {
    activationDirection: getActivationDirection(newTriggerOffset),
    transitioning: isTransitioning,
    instant: instantType,
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps, { children: childrenToRender }],
    stateAttributesMapping,
  });
});

export namespace TooltipViewport {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The content to render inside the transition container.
     */
    children?: React.ReactNode;
  }

  export interface State {
    activationDirection?: string | undefined;
  }
}

type Offset = {
  horizontal: number;
  vertical: number;
};

/**
 * Returns a string describing the provided offset.
 * It describes both the horizontal and vertical offset, separated by a space.
 *
 * @param offset
 */
function getActivationDirection(offset: Offset | null): string | undefined {
  if (!offset) {
    return undefined;
  }

  return `${getValueWithTolerance(offset.horizontal, 5, 'right', 'left')} ${getValueWithTolerance(offset.vertical, 5, 'down', 'up')}`;
}

/**
 * Returns a label describing the value (positive/negative) trating values
 * within tolarance as zero.
 *
 * @param value Value to check
 * @param tolerance Tolerance to treat the value as zero.
 * @param positiveLabel
 * @param negativeLabel
 * @returns If 0 < abs(value) < tolerance, returns an empty string. Otherwise returns positiveLabel or negativeLabel.
 */
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

/**
 * Calculates the relative position between centers of two elements.
 */
function calculateRelativePosition(from: Element, to: Element): Offset {
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
