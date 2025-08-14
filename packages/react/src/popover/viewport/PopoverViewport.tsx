import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { usePrevious } from '@base-ui-components/utils/usePrevious';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { BaseUIComponentProps } from '../../utils/types';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { useRenderElement } from '../../utils/useRenderElement';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { selectors } from '../store';

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

  const [previousChildrenHtml, setPreviousChildrenHtml] = React.useState<string | null>(null);
  const [newTriggerOffset, setNewTriggerOffset] = React.useState<Offset | null>(null);
  const capturedHtmlRef = React.useRef<string | null>(null);

  const currentContentRef = React.useRef<HTMLDivElement>(null);
  const nextContainerRef = React.useRef<HTMLDivElement>(null);
  const onAnimationsFinished = useAnimationsFinished(nextContainerRef, true);
  const cleanupTimeout = useTimeout();

  // Capture HTML continuously when not transitioning
  useIsoLayoutEffect(() => {
    if (currentContentRef.current && !previousChildrenHtml) {
      capturedHtmlRef.current = currentContentRef.current.innerHTML;
    }
  });

  // Handle trigger changes
  if (
    activeTrigger &&
    previousActiveTrigger &&
    activeTrigger !== previousActiveTrigger &&
    !previousChildrenHtml &&
    capturedHtmlRef.current
  ) {
    setPreviousChildrenHtml(capturedHtmlRef.current);
    const offset = calculateRelativePosition(previousActiveTrigger, activeTrigger);
    setNewTriggerOffset(offset);
    cleanupTimeout.start(10, () => {
      onAnimationsFinished(() => {
        setPreviousChildrenHtml(null);
        capturedHtmlRef.current = null;
      });
    });
  }

  let childrenToRender: React.ReactNode;
  if (previousChildrenHtml == null) {
    childrenToRender = (
      <div data-current ref={currentContentRef} key="current">
        {children}
      </div>
    );
  } else {
    childrenToRender = (
      <React.Fragment>
        <div
          data-previous
          inert
          key="previous"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: previousChildrenHtml }}
        />
        <div data-next ref={nextContainerRef} key="current">
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
