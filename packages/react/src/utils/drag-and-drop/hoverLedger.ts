import type { DraggableTargetRecord } from '../../draggable/target/DraggableTarget';
import type {
  DragEventDetails,
  DropTargetChangeEventDetails,
  DropTargetEventReasonMap,
} from './types';
import { dispatchToDropTarget, isActiveDropTargetRegistration } from './dropTarget';
import type { DropTargetEventName, DropTargetGetter } from './dropTarget';

/**
 * The drop targets one drag has entered and still owes a leave.
 *
 * Every enter a target receives is paired with exactly one leave, even when the
 * target unregisters while hovered or a handler ends the drag mid-dispatch. The
 * ledger records a target just before its enter goes out and drops it just before
 * its leave goes out, so after an interrupted dispatch it lists exactly the targets
 * that still hold hover state. A target that unregisters while owed a leave keeps
 * its registration here until that leave has gone out.
 *
 * The lifecycle creates one per drag session and routes every target dispatch but
 * the drop through it.
 */
export interface HoverLedger {
  /** Whether `element` has received an enter but not the matching leave. */
  has(element: Element): boolean;
  /** The records still owed a leave, innermost first. A copy. */
  owed(): DraggableTargetRecord[];
  /**
   * Deliver `record`'s enter. The target is owed a leave from here, even if its
   * enter handler ends the drag.
   */
  enter(record: DraggableTargetRecord, eventDetails: DropTargetChangeEventDetails): void;
  /**
   * Deliver `record`'s leave. Only this target stops being hovered, so a leave
   * handler that unregisters a sibling still finds the sibling owed its own leave.
   */
  leave(record: DraggableTargetRecord, eventDetails: DropTargetChangeEventDetails): void;
  /**
   * Leave the targets of `previous` that `current` doesn't hold, then enter the new
   * ones. `shouldContinue` is checked before every delivery, because a handler can
   * end the drag and the end delivers the remaining terminal events itself. A
   * completed round leaves the ledger listing `current`, in bubbling order.
   */
  change(
    previous: readonly DraggableTargetRecord[],
    current: readonly DraggableTargetRecord[],
    eventDetails: DropTargetChangeEventDetails,
    shouldContinue: () => boolean,
  ): void;
  /**
   * Swap each owed record for its freshly resolved counterpart, matched by element,
   * without adding or removing any. The lifecycle calls it on frames whose stack
   * holds the same elements. The terminal leave reads these records, and must report
   * the latest `currentTarget.payload`, as the moves in between did.
   */
  refresh(fresh: readonly DraggableTargetRecord[]): void;
  /** Deliver `eventName` to each of `targets`, checking `shouldContinue` before each. */
  dispatchToAll<K extends DropTargetEventName>(
    targets: readonly DraggableTargetRecord[],
    eventName: K,
    eventDetails: DragEventDetails<DropTargetEventReasonMap[K]>,
    shouldContinue: () => boolean,
  ): void;
  /**
   * Keep `getParameters` readable while `element` leaves the registry, so the leave
   * it is owed can still go out. Does nothing when another hold on `element` takes
   * over, since the element stays registered.
   */
  retain(element: Element, getParameters: DropTargetGetter): void;
}

export function createHoverLedger(): HoverLedger {
  const hovered: DraggableTargetRecord[] = [];
  // The registrations of targets that unregistered while owed a leave.
  const retained = new Map<Element, DropTargetGetter>();

  function indexOf(element: Element): number {
    return hovered.findIndex((record) => record.element === element);
  }

  function dispatch<K extends DropTargetEventName>(
    record: DraggableTargetRecord,
    eventName: K,
    eventDetails: DragEventDetails<DropTargetEventReasonMap[K]>,
  ): void {
    dispatchToDropTarget(record, eventName, eventDetails, retained.get(record.element));
  }

  function enter(record: DraggableTargetRecord, eventDetails: DropTargetChangeEventDetails) {
    hovered.push(record);
    dispatch(record, 'onDraggableEnter', eventDetails);
  }

  function leave(record: DraggableTargetRecord, eventDetails: DropTargetChangeEventDetails) {
    const index = indexOf(record.element);
    if (index !== -1) {
      hovered.splice(index, 1);
    }
    try {
      dispatch(record, 'onDraggableLeave', eventDetails);
    } finally {
      // The leave its registration was kept for has gone out.
      retained.delete(record.element);
    }
  }

  return {
    has: (element) => indexOf(element) !== -1,
    owed: () => hovered.slice(),
    enter,
    leave,
    change(previous, current, eventDetails, shouldContinue) {
      const currentByElement = new Map(current.map((record) => [record.element, record] as const));
      const visited = new Set<Element>();

      for (const record of previous) {
        if (!shouldContinue()) {
          return;
        }
        visited.add(record.element);
        // Keep a persisting target's payload current for later dispatch.
        const fresh = currentByElement.get(record.element);
        if (!fresh) {
          leave(record, eventDetails);
          continue;
        }
        const index = indexOf(fresh.element);
        if (index === -1) {
          hovered.push(fresh);
        } else {
          hovered[index] = fresh;
        }
      }

      for (const record of current) {
        if (!shouldContinue()) {
          return;
        }
        if (!visited.has(record.element)) {
          enter(record, eventDetails);
        }
      }

      // Every event went out. Sync to the bubble-ordered stack.
      hovered.length = 0;
      hovered.push(...current);
    },
    refresh(fresh) {
      // Runs on every element-equal move frame. Between change rounds the ledger
      // mirrors the resolved stack order, so the record at the same index almost
      // always matches. Scan only on a mismatch to keep the per-frame path
      // allocation-free.
      for (let i = 0; i < hovered.length; i += 1) {
        if (fresh[i]?.element === hovered[i].element) {
          hovered[i] = fresh[i];
          continue;
        }
        for (let j = 0; j < fresh.length; j += 1) {
          if (fresh[j].element === hovered[i].element) {
            hovered[i] = fresh[j];
            break;
          }
        }
      }
    },
    dispatchToAll(targets, eventName, eventDetails, shouldContinue) {
      for (const record of targets) {
        if (!shouldContinue()) {
          return;
        }
        dispatch(record, eventName, eventDetails);
      }
    },
    retain(element, getParameters) {
      if (isActiveDropTargetRegistration(element, getParameters)) {
        retained.set(element, getParameters);
      }
    },
  };
}
