import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { isElement } from '@floating-ui/utils/dom';
import { Hook } from '@base-ui-components/utils/Hook';
import { useValueAsRef } from '@base-ui-components/utils/useValueAsRef';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import type { FloatingContext, FloatingRootContext } from '../types';
import { contains, getDocument, isMouseLikePointerType } from '../utils';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import type { UseHoverProps } from './useHover';
import { getDelay } from './useHover';
import { useFloatingTree } from '../components/FloatingTree';
import { safePolygonIdentifier, HoverInteraction } from './useHoverInteractionSharedState';
import { FloatingUIOpenChangeDetails, HTMLProps } from '../../utils/types';

export interface UseHoverReferenceInteractionProps extends Omit<UseHoverProps, 'triggerElement'> {
  /**
   * Whether the hook controls the active trigger. When false, the props are
   * returned under the `trigger` key so they can be applied to inactive
   * triggers via `getTriggerProps`.
   * @default true
   */
  isActiveTrigger?: boolean;
  triggerElementRef?: Readonly<React.RefObject<Element | null>>;
}

function getRestMs(value: number | (() => number)) {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}

const EMPTY_REF: Readonly<React.RefObject<Element | null>> = { current: null };

@Hook.setup
class HoverReferenceInteraction extends HoverInteraction {
  store: FloatingRootContext;

  constructor(
    context: FloatingRootContext | FloatingContext,
    props: UseHoverReferenceInteractionProps = {},
  ) {
    super();
    this.store = 'rootStore' in context ? context.rootStore : context;
  }

  isClickLikeOpenEvent = () => {
    if (this.interactedInside) {
      return true;
    }

    const { dataRef } = this.store.context;

    return dataRef.current.openEvent
      ? ['click', 'mousedown'].includes(dataRef.current.openEvent.type)
      : false;
  };

  cleanupMouseMoveHandler = () => {
    this.unbindMouseMove();
    this.handler = undefined;
  };

  clearPointerEvents = () => {
    if (this.performedPointerEventsMutation) {
      const body = getDocument(this.store.select('domReferenceElement')).body;
      body.style.pointerEvents = '';
      body.removeAttribute(safePolygonIdentifier);
      this.performedPointerEventsMutation = false;
    }
  };

  use(
    context: FloatingRootContext | FloatingContext,
    props: UseHoverReferenceInteractionProps = {},
  ): HTMLProps | undefined {
    const store = 'rootStore' in context ? context.rootStore : context;
    const { dataRef, events } = store.context;

    React.useEffect(() => {
      this.store = store;
    });

    const {
      enabled = true,
      delay = 0,
      handleClose = null,
      mouseOnly = false,
      restMs = 0,
      move = true,
      triggerElementRef = EMPTY_REF,
      externalTree,
      isActiveTrigger = true,
    } = props;

    const tree = useFloatingTree(externalTree);

    const handleCloseRef = useValueAsRef(handleClose);
    const delayRef = useValueAsRef(delay);
    const restMsRef = useValueAsRef(restMs);

    if (isActiveTrigger) {
      // eslint-disable-next-line no-underscore-dangle
      this.handleCloseOptions = handleCloseRef.current?.__options;
    }

    const closeWithDelay = React.useCallback(
      (event: MouseEvent, runElseBranch = true) => {
        const closeDelay = getDelay(delayRef.current, 'close', this.pointerType);
        if (closeDelay && !this.handler) {
          this.openChangeTimeout.start(closeDelay, () =>
            store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event)),
          );
        } else if (runElseBranch) {
          this.openChangeTimeout.clear();
          store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event));
        }
      },
      [delayRef, this.handler, store, this.pointerType, this.openChangeTimeout],
    );

    // When closing before opening, clear the delay timeouts to cancel it
    // from showing.
    React.useEffect(() => {
      if (!enabled) {
        return undefined;
      }

      const onOpenChangeLocal = (details: FloatingUIOpenChangeDetails) => {
        if (!details.open) {
          this.openChangeTimeout.clear();
          this.restTimeout.clear();
          this.blockMouseMove = true;
          this.restTimeoutPending = false;
        }
      };

      events.on('openchange', onOpenChangeLocal);
      return () => {
        events.off('openchange', onOpenChangeLocal);
      };
    }, [enabled, events, this]);

    const handleScrollMouseLeave = useStableCallback((event: MouseEvent) => {
      if (this.isClickLikeOpenEvent()) {
        return;
      }
      if (!dataRef.current.floatingContext) {
        return;
      }

      const triggerElements = store.context.triggerElements;
      if (event.relatedTarget && triggerElements.hasElement(event.relatedTarget as Element)) {
        return;
      }

      handleCloseRef.current?.({
        ...dataRef.current.floatingContext,
        tree,
        x: event.clientX,
        y: event.clientY,
        onClose: () => {
          this.clearPointerEvents();
          this.cleanupMouseMoveHandler();
          if (!this.isClickLikeOpenEvent()) {
            closeWithDelay(event);
          }
        },
      })(event);
    });

    React.useEffect(() => {
      if (!enabled) {
        return undefined;
      }

      const trigger =
        (triggerElementRef.current as HTMLElement | null) ??
        (isActiveTrigger ? (store.select('domReferenceElement') as HTMLElement | null) : null);

      if (!isElement(trigger)) {
        return undefined;
      }

      const onMouseEnter = (event: MouseEvent) => {
        this.openChangeTimeout.clear();
        this.blockMouseMove = false;

        if (mouseOnly && !isMouseLikePointerType(this.pointerType)) {
          return;
        }

        // Only rest delay is set; there's no fallback delay.
        // This will be handled by `onMouseMove`.
        if (getRestMs(restMsRef.current) > 0 && !getDelay(delayRef.current, 'open')) {
          return;
        }

        const openDelay = getDelay(delayRef.current, 'open', this.pointerType);
        const currentDomReference = store.select('domReferenceElement');
        const allTriggers = store.context.triggerElements;

        const isOverInactiveTrigger =
          (allTriggers.hasElement(event.target as Element) ||
            allTriggers.hasMatchingElement((t) => contains(t, event.target as Element))) &&
          (!currentDomReference || !contains(currentDomReference, event.target as Element));

        const triggerNode = (event.currentTarget as HTMLElement) ?? null;

        if (openDelay) {
          this.openChangeTimeout.start(openDelay, () => {
            if (!store.select('open')) {
              store.setOpen(
                true,
                createChangeEventDetails(REASONS.triggerHover, event, triggerNode),
              );
            }
          });
        } else if (!store.select('open') || isOverInactiveTrigger) {
          store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, event, triggerNode));
        }
      };

      const onMouseLeave = (event: MouseEvent) => {
        if (this.isClickLikeOpenEvent()) {
          this.clearPointerEvents();
          return;
        }

        this.unbindMouseMove();

        const domReferenceElement = store.select('domReferenceElement');
        const doc = getDocument(domReferenceElement);
        this.restTimeout.clear();
        this.restTimeoutPending = false;

        const triggerElements = store.context.triggerElements;

        if (event.relatedTarget && triggerElements.hasElement(event.relatedTarget as Element)) {
          return;
        }

        if (handleCloseRef.current && dataRef.current.floatingContext) {
          if (!store.select('open')) {
            this.openChangeTimeout.clear();
          }

          this.handler = handleCloseRef.current({
            ...dataRef.current.floatingContext,
            tree,
            x: event.clientX,
            y: event.clientY,
            onClose: () => {
              this.clearPointerEvents();
              this.cleanupMouseMoveHandler();
              if (!this.isClickLikeOpenEvent()) {
                closeWithDelay(event, true);
              }
            },
          });

          const handler = this.handler;
          handler(event);

          doc.addEventListener('mousemove', handler);
          this.unbindMouseMove = () => {
            doc.removeEventListener('mousemove', handler);
          };

          return;
        }

        const shouldClose =
          this.pointerType === 'touch'
            ? !contains(store.select('floatingElement'), event.relatedTarget as Element | null)
            : true;

        if (shouldClose) {
          closeWithDelay(event);
        }
      };

      const onScrollMouseLeave = (event: MouseEvent) => {
        handleScrollMouseLeave(event);
      };

      if (store.select('open')) {
        trigger.addEventListener('mouseleave', onScrollMouseLeave);
      }

      if (move) {
        trigger.addEventListener('mousemove', onMouseEnter, {
          once: true,
        });
      }

      trigger.addEventListener('mouseenter', onMouseEnter);
      trigger.addEventListener('mouseleave', onMouseLeave);

      return () => {
        trigger.removeEventListener('mouseleave', onScrollMouseLeave);

        if (move) {
          trigger.removeEventListener('mousemove', onMouseEnter);
        }

        trigger.removeEventListener('mouseenter', onMouseEnter);
        trigger.removeEventListener('mouseleave', onMouseLeave);
      };
    }, [
      dataRef,
      delayRef,
      closeWithDelay,
      store,
      enabled,
      handleCloseRef,
      handleScrollMouseLeave,
      isActiveTrigger,
      mouseOnly,
      move,
      restMsRef,
      triggerElementRef,
      tree,
    ]);

    return React.useMemo<HTMLProps>(() => {
      const setPointerRef = (event: React.PointerEvent) => {
        this.pointerType = event.pointerType;
      };

      return {
        onPointerDown: setPointerRef,
        onPointerEnter: setPointerRef,
        onMouseMove: (event) => {
          const { nativeEvent } = event;
          const trigger = event.currentTarget as HTMLElement;

          const currentDomReference = store.select('domReferenceElement');
          const allTriggers = store.context.triggerElements;
          const currentOpen = store.select('open');

          const isOverInactiveTrigger =
            (allTriggers.hasElement(event.target as Element) ||
              allTriggers.hasMatchingElement((t) => contains(t, event.target as Element))) &&
            (!currentDomReference || !contains(currentDomReference, event.target as Element));

          if (mouseOnly && !isMouseLikePointerType(this.pointerType)) {
            return;
          }

          if ((currentOpen && !isOverInactiveTrigger) || getRestMs(restMsRef.current) === 0) {
            return;
          }

          if (
            !isOverInactiveTrigger &&
            this.restTimeoutPending &&
            event.movementX ** 2 + event.movementY ** 2 < 2
          ) {
            return;
          }

          this.restTimeout.clear();

          const handleMouseMove = () => {
            if (!this.blockMouseMove && (!currentOpen || isOverInactiveTrigger)) {
              store.setOpen(
                true,
                createChangeEventDetails(REASONS.triggerHover, nativeEvent, trigger),
              );
            }
          };

          if (this.pointerType === 'touch') {
            ReactDOM.flushSync(() => {
              handleMouseMove();
            });
          } else if (isOverInactiveTrigger && currentOpen) {
            handleMouseMove();
          } else {
            this.restTimeoutPending = true;
            this.restTimeout.start(getRestMs(restMsRef.current), handleMouseMove);
          }
        },
      };
    }, [this, mouseOnly, store, restMsRef]);
  }
}

/**
 * Provides hover interactions that should be attached to reference or trigger
 * elements.
 */
export function useHoverReferenceInteraction(
  context: FloatingRootContext | FloatingContext,
  props: UseHoverReferenceInteractionProps = {},
): HTMLProps | undefined {
  const result = Hook.use(HoverReferenceInteraction, context, props);
  return result;
}
