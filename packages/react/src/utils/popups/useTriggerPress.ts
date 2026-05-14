'use client';
import * as React from 'react';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type {
  ElementProps,
  FloatingContext,
  FloatingRootContext,
} from '../../floating-ui-react/types';
import { getTarget, isTypeableElement } from '../../floating-ui-react/utils/element';
import { isMouseLikePointerType } from '../../floating-ui-react/utils/event';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

interface UseTriggerPressProps {
  enabled?: boolean | undefined;
  event?: 'click' | 'mousedown' | undefined;
  toggle?: boolean | undefined;
  ignoreMouse?: boolean | undefined;
  stickIfOpen?: boolean | undefined;
}

export function useTriggerPress(
  context: FloatingRootContext | FloatingContext,
  props: UseTriggerPressProps = {},
): ElementProps {
  const {
    enabled = true,
    event: eventOption = 'click',
    toggle = true,
    ignoreMouse = false,
    stickIfOpen = true,
  } = props;

  const store = 'rootStore' in context ? context.rootStore : context;
  const { dataRef } = store.context;
  const pointerTypeRef = React.useRef<'mouse' | 'pen' | 'touch'>(undefined);
  const frame = useAnimationFrame();

  const reference: ElementProps['reference'] = React.useMemo(() => {
    function setOpen(nextOpen: boolean, nativeEvent: MouseEvent, target: HTMLElement) {
      store.setOpen(nextOpen, createChangeEventDetails(REASONS.triggerPress, nativeEvent, target));
    }

    function getNextOpen(
      open: boolean,
      currentTarget: EventTarget | null,
      isRelevantOpenEvent: (eventType: string | undefined) => boolean,
    ) {
      const openEvent = dataRef.current.openEvent;

      if (open && store.select('domReferenceElement') !== currentTarget) {
        return true;
      }

      if (!open || !toggle) {
        return true;
      }

      return openEvent && stickIfOpen ? !isRelevantOpenEvent(openEvent.type) : false;
    }

    return {
      onPointerDown(event) {
        pointerTypeRef.current = event.pointerType;
      },
      onMouseDown(event) {
        const pointerType = pointerTypeRef.current;
        const nativeEvent = event.nativeEvent;
        const open = store.select('open');

        if (
          event.button !== 0 ||
          eventOption === 'click' ||
          (isMouseLikePointerType(pointerType, true) && ignoreMouse)
        ) {
          return;
        }

        const nextOpen = getNextOpen(
          open,
          event.currentTarget,
          (openEventType) => openEventType === 'click' || openEventType === 'mousedown',
        );

        const target = getTarget(nativeEvent);

        if (isTypeableElement(target)) {
          setOpen(nextOpen, nativeEvent, target as HTMLElement);
          return;
        }

        const eventCurrentTarget = event.currentTarget as HTMLElement;

        frame.request(() => {
          setOpen(nextOpen, nativeEvent, eventCurrentTarget);
        });
      },
      onClick(event) {
        const pointerType = pointerTypeRef.current;

        if (eventOption === 'mousedown' && pointerType) {
          pointerTypeRef.current = undefined;
          return;
        }

        if (isMouseLikePointerType(pointerType, true) && ignoreMouse) {
          return;
        }

        const open = store.select('open');
        const nextOpen = getNextOpen(
          open,
          event.currentTarget,
          (openEventType) =>
            openEventType === 'click' ||
            openEventType === 'mousedown' ||
            openEventType === 'keydown' ||
            openEventType === 'keyup',
        );
        setOpen(nextOpen, event.nativeEvent, event.currentTarget as HTMLElement);
      },
      onKeyDown() {
        pointerTypeRef.current = undefined;
      },
    };
  }, [dataRef, eventOption, frame, ignoreMouse, store, stickIfOpen, toggle]);

  return React.useMemo(() => (enabled ? { reference } : EMPTY_OBJECT), [enabled, reference]);
}

export function useClickTriggerPress(
  context: FloatingRootContext | FloatingContext | null,
  stickIfOpen = true,
): ElementProps {
  const store = context && ('rootStore' in context ? context.rootStore : context);
  const dataRef = store?.context.dataRef;

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({
      onClick(event) {
        if (!store || !dataRef) {
          return;
        }

        const open = store.select('open');
        const openEvent = dataRef.current.openEvent;
        /* eslint-disable no-nested-ternary */
        const nextOpen =
          !open || store.select('domReferenceElement') !== event.currentTarget
            ? true
            : openEvent && stickIfOpen
              ? !isClickLikeOpenEvent(openEvent.type)
              : false;
        /* eslint-enable no-nested-ternary */

        store.setOpen(
          nextOpen,
          createChangeEventDetails(
            REASONS.triggerPress,
            event.nativeEvent,
            event.currentTarget as HTMLElement,
          ),
        );
      },
    }),
    [dataRef, store, stickIfOpen],
  );

  return React.useMemo(() => (store ? { reference } : EMPTY_OBJECT), [reference, store]);
}

function isClickLikeOpenEvent(eventType: string | undefined) {
  return eventType === 'click' || eventType === 'keydown' || eventType === 'keyup';
}

interface UseInputPressProps {
  enabled?: boolean | undefined;
  touchOpenDelay?: number | undefined;
}

export function useInputPress(
  context: FloatingRootContext | FloatingContext,
  props: UseInputPressProps = {},
): ElementProps {
  const { enabled = true, touchOpenDelay = 0 } = props;

  const store = 'rootStore' in context ? context.rootStore : context;
  const pointerTypeRef = React.useRef<'mouse' | 'pen' | 'touch'>(undefined);
  const frame = useAnimationFrame();
  const touchOpenTimeout = useTimeout();

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({
      onPointerDown(event) {
        pointerTypeRef.current = event.pointerType;
      },
      onMouseDown(event) {
        if (event.button !== 0) {
          return;
        }

        const nativeEvent = event.nativeEvent;
        const pointerType = pointerTypeRef.current;
        const target = getTarget(nativeEvent);

        const setOpen = (element: HTMLElement) => {
          const details = createChangeEventDetails(REASONS.inputPress, nativeEvent, element);

          if (pointerType === 'touch' && touchOpenDelay > 0) {
            touchOpenTimeout.start(touchOpenDelay, () => store.setOpen(true, details));
          } else {
            store.setOpen(true, details);
          }
        };

        if (isTypeableElement(target)) {
          setOpen(target as HTMLElement);
          return;
        }

        const eventCurrentTarget = event.currentTarget as HTMLElement;
        frame.request(() => setOpen(eventCurrentTarget));
      },
      onKeyDown() {
        pointerTypeRef.current = undefined;
      },
    }),
    [frame, store, touchOpenDelay, touchOpenTimeout],
  );

  return React.useMemo(() => (enabled ? { reference } : EMPTY_OBJECT), [enabled, reference]);
}
