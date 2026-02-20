'use client';
import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStore } from '@base-ui/utils/store';
import { TemporalSupportedObject } from '@base-ui/react/types';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { CalendarViewportDataAttributes } from './CalendarViewportDataAttributes';
import { useSharedCalendarRootContext } from '../root/SharedCalendarRootContext';
import { CalendarNavigationDirection, selectors } from '../store';
import { useTemporalAdapter } from '../../temporal-adapter-provider/TemporalAdapterContext';

const getNavigationDirectionAttribute = (navigationDirection: CalendarNavigationDirection) => {
  switch (navigationDirection) {
    case 'none':
      return null;
    default:
      return {
        [CalendarViewportDataAttributes.navigationDirection]: navigationDirection,
      };
  }
};

/**
 * A viewport for displaying calendar month transitions.
 * This component is only required if you want to animate certain part of a calendar when navigating between months.
 * The first rendered child element has to handle a ref.
 * Passes `data-current` to the currently visible content and `data-previous` to the previous content when animating between two.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Calendar](https://base-ui.com/react/components/calendar)
 */
export function CalendarViewport({ children }: CalendarViewport.Props): React.JSX.Element {
  const store = useSharedCalendarRootContext();
  const adapter = useTemporalAdapter();

  const navigationDirection = useStore(store, selectors.navigationDirection);
  const visibleMonth = useStore(store, selectors.visibleMonth);
  const lastHandledVisibleMonth = React.useRef<TemporalSupportedObject | null>(visibleMonth);

  const capturedNodeRef = React.useRef<HTMLElement | null>(null);
  const [previousContentNode, setPreviousContentNode] = React.useState<HTMLElement | null>(null);

  const currentContainerRef = React.useRef<HTMLElement>(null);
  const previousContainerRef = React.useRef<HTMLElement>(null);

  const onAnimationsFinished = useAnimationsFinished(currentContainerRef, true, false);
  const cleanupTimeout = useAnimationFrame();
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const [showStartingStyleAttribute, setShowStartingStyleAttribute] = React.useState(false);

  useIsoLayoutEffect(() => {
    // When the visible month changes,
    // set the captured children HTML to state,
    // so we can render both new and old month when transitioning.
    if (
      visibleMonth &&
      lastHandledVisibleMonth.current &&
      !adapter.isEqual(lastHandledVisibleMonth.current, visibleMonth) &&
      capturedNodeRef.current
    ) {
      // Cancel the previous transition's pending animation-finished callback
      // abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setPreviousContentNode(capturedNodeRef.current);
      setShowStartingStyleAttribute(true);

      cleanupTimeout.request(() => {
        setShowStartingStyleAttribute(false);
        onAnimationsFinished(() => {
          setPreviousContentNode(null);
          capturedNodeRef.current = null;
        }, abortController.signal);
      });

      lastHandledVisibleMonth.current = visibleMonth;
    }
  }, [adapter, cleanupTimeout, onAnimationsFinished, visibleMonth]);

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

    // create the wrapper element of the same type as the source element
    const wrapper = document.createElement(source.localName);
    for (const child of Array.from(source.childNodes)) {
      wrapper.appendChild(child.cloneNode(true));
    }

    capturedNodeRef.current = wrapper;
  });

  const currentChildren = React.cloneElement(children, {
    ref: currentContainerRef,
    key: 'current',
  });

  const isTransitioning = previousContentNode != null;
  let childrenToRender: React.ReactNode;
  if (!isTransitioning) {
    childrenToRender = currentChildren;
  } else {
    childrenToRender = (
      <React.Fragment>
        {navigationDirection === 'previous' && currentChildren}
        {React.createElement(previousContentNode.localName, {
          className: currentContainerRef?.current?.className,
          key: 'previous',
          ref: previousContainerRef,
          'data-previous': '',
          'data-starting-style': showStartingStyleAttribute ? '' : undefined,
          'data-ending-style': showStartingStyleAttribute ? undefined : '',
          inert: inertValue(true),
          ...getNavigationDirectionAttribute(navigationDirection),
        })}
        {navigationDirection === 'next' && currentChildren}
      </React.Fragment>
    );
  }

  // Avoids remounting the current month after transition ends.
  if (currentContainerRef.current) {
    if (isTransitioning) {
      currentContainerRef.current.setAttribute('data-current', '');
      if (showStartingStyleAttribute) {
        currentContainerRef.current.setAttribute('data-starting-style', '');
      } else {
        currentContainerRef.current.setAttribute('data-ending-style', '');
        currentContainerRef.current.removeAttribute('data-starting-style');
      }
      const navigationDirectionAttribute = getNavigationDirectionAttribute(navigationDirection);
      if (navigationDirectionAttribute) {
        currentContainerRef.current.setAttribute(
          ...Object.entries(navigationDirectionAttribute)[0],
        );
      }
    } else {
      const attributes = [
        CalendarViewportDataAttributes.current,
        CalendarViewportDataAttributes.startingStyle,
        CalendarViewportDataAttributes.endingStyle,
        CalendarViewportDataAttributes.navigationDirection,
      ];
      for (const attribute of attributes) {
        currentContainerRef.current.removeAttribute(attribute);
      }
    }
  }

  // When previousContentNode is present, imperatively populate the previous container with the cloned children.
  useIsoLayoutEffect(() => {
    const container = previousContainerRef.current;
    if (!container || !previousContentNode) {
      return;
    }

    container.replaceChildren(...Array.from(previousContentNode.childNodes));
  }, [previousContentNode]);

  return childrenToRender;
}

export interface CalendarViewportProps {
  /**
   * The content to render inside the transition container.
   */
  children: React.JSX.Element;
}

export interface CalendarViewportState {
  /**
   * Indicates the direction of the navigation (based on the month navigating to).
   */
  navigationDirection: CalendarNavigationDirection;
}

export namespace CalendarViewport {
  export type Props = CalendarViewportProps;
  export type State = CalendarViewportState;
}
