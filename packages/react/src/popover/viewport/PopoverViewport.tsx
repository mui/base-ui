import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';
import { usePrevious } from '@base-ui-components/utils/usePrevious';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { BaseUIComponentProps } from '../../utils/types';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { useRenderElement } from '../../utils/useRenderElement';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { selectors } from '../store';

const customStyleHookMapping: CustomStyleHookMapping<PopoverViewport.State> = {
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
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverViewport = React.forwardRef(function PopoverViewport(
  componentProps: PopoverViewport.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, children, ...elementProps } = componentProps;
  const { store } = usePopoverRootContext();

  const activeTrigger = useStore(store, selectors.activeTriggerElement);
  const previousActiveTrigger = usePrevious(activeTrigger);

  const capturedNodeRef = React.useRef<HTMLElement | null>(null);
  const [previousContentNode, setPreviousContentNode] = React.useState<HTMLElement | null>(null);

  const [newTriggerOffset, setNewTriggerOffset] = React.useState<Offset | null>(null);

  const currentContainerRef = React.useRef<HTMLDivElement>(null);
  const nextContainerRef = React.useRef<HTMLDivElement>(null);
  const previousContainerRef = React.useRef<HTMLDivElement>(null);

  const onAnimationsFinished = useAnimationsFinished(nextContainerRef, true);

  const cleanupTimeout = useAnimationFrame();

  const [previousContentDimensions, setPreviousContentDimensions] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  // Capture a clone of the current content DOM subtree when not transitioning.
  // We can't store previous React nodes as they may be stateful; instead we capture DOM clones for visual continuity.
  useIsoLayoutEffect(() => {
    if (currentContainerRef.current && !previousContentNode) {
      const wrapper = document.createElement('div');
      const source = currentContainerRef.current;
      for (const child of Array.from(source.childNodes)) {
        wrapper.appendChild(child.cloneNode(true));
      }
      capturedNodeRef.current = wrapper;
    }
  });

  // When a trigger changes, set the captured children HTML to state,
  // so we can render both new and old content.
  if (
    activeTrigger &&
    previousActiveTrigger &&
    activeTrigger !== previousActiveTrigger &&
    !previousContentNode &&
    capturedNodeRef.current
  ) {
    // Capture the current content dimensions, so we can set them on the previous content while transitioning.
    // This makes the previuous content independent of the popup size changes, preventing layout shifts during the transition.
    const currentContentRect = currentContainerRef.current?.getBoundingClientRect();
    if (currentContentRect) {
      setPreviousContentDimensions({
        width: currentContentRect.width,
        height: currentContentRect.height,
      });
    }

    // Prepare a fresh clone for the previous content snapshot.
    setPreviousContentNode(capturedNodeRef.current);

    // Calculate the relative position between the previous and new trigger,
    // so we can pass it to the style hook for animation purposes.
    const offset = calculateRelativePosition(previousActiveTrigger, activeTrigger);
    setNewTriggerOffset(offset);

    cleanupTimeout.request(() => {
      onAnimationsFinished(() => {
        setPreviousContentNode(null);
        setPreviousContentDimensions(null);
        capturedNodeRef.current = null;
      });
    });
  }

  let childrenToRender: React.ReactNode;
  if (previousContentNode == null) {
    childrenToRender = (
      <div data-current ref={currentContainerRef}>
        {children}
      </div>
    );
  } else {
    childrenToRender = (
      <React.Fragment>
        <div
          data-previous
          inert
          ref={previousContainerRef}
          style={{
            width: previousContentDimensions?.width,
            height: previousContentDimensions?.height,
            position: 'absolute',
          }}
          key={'previous'}
        />
        <div data-next ref={nextContainerRef}>
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

  const state = React.useMemo(() => {
    return {
      activationDirection: getActivationDirection(newTriggerOffset),
    };
  }, [newTriggerOffset]);

  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps, { children: childrenToRender }],
    customStyleHookMapping,
  });
});

export namespace PopoverViewport {
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
