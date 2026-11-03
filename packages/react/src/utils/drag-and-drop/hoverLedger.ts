import type { DraggableTargetRecord } from '../../draggable/target/DraggableTarget';
import type {
  DragEventDetails,
  DropTargetChangeEventDetails,
  DropTargetEventReasonMap,
} from './types';
import { dispatchToDropTarget, getEnterRegistration } from './dropTarget';
import type { DropTargetEventName, DropTargetGetter } from './dropTarget';

/**
 * The drop targets a drag has entered and still owes a leave. One per session. Every
 * target dispatch but the drop goes through it. Each enter gets exactly one leave, even
 * if the target unregisters (see `release`) or a handler ends the drag mid-dispatch,
 * since a target is recorded just before its enter and removed just before its leave.
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
   * ones. Stops once the session isn't live, since a handler can end the drag and the
   * end sequence delivers the rest. A completed round leaves the ledger listing
   * `current`, in bubbling order.
   */
  change(
    previous: readonly DraggableTargetRecord[],
    current: readonly DraggableTargetRecord[],
    eventDetails: DropTargetChangeEventDetails,
  ): void;
  /**
   * Swap each owed record for its freshly resolved one, matched by element, without
   * adding or removing any. Called on frames whose stack holds the same elements, so
   * the terminal leave reports the latest `currentTarget.payload`.
   */
  refresh(fresh: readonly DraggableTargetRecord[]): void;
  /** Deliver `eventName` to each of `targets`, while the session is live. */
  dispatchToAll<K extends DropTargetEventName>(
    targets: readonly DraggableTargetRecord[],
    eventName: K,
    eventDetails: DragEventDetails<DropTargetEventReasonMap[K]>,
  ): void;
  /**
   * Mark `element` as unregistered while owed an enter or leave. Its enter then goes
   * through the registration that resolved its record, and its leave through the one
   * that got its enter. Unused while another hold keeps the element registered.
   */
  release(element: Element): void;
}

/** `change` and `dispatchToAll` check `isLive` before each delivery. */
export function createHoverLedger(isLive: () => boolean): HoverLedger {
  const hovered: DraggableTargetRecord[] = [];
  // Targets that unregistered while owed an enter or leave. Only these enter through
  // their record's registration, so one unregistered mid-round before its enter gets neither.
  const released = new Set<Element>();
  // The registration each owed target's enter went to. Its leave falls back to it.
  const enteredWith = new Map<Element, DropTargetGetter>();

  function indexOf(element: Element): number {
    return hovered.findIndex((record) => record.element === element);
  }

  function dispatch<K extends DropTargetEventName>(
    record: DraggableTargetRecord,
    eventName: K,
    eventDetails: DragEventDetails<DropTargetEventReasonMap[K]>,
  ): void {
    dispatchToDropTarget(record, eventName, eventDetails, enteredWith.get(record.element));
  }

  function enter(record: DraggableTargetRecord, eventDetails: DropTargetChangeEventDetails) {
    hovered.push(record);
    // Set before the handler runs, since it may unregister the target.
    const getParameters = getEnterRegistration(record, released.has(record.element));
    if (getParameters) {
      enteredWith.set(record.element, getParameters);
    }
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
      // The leave it was owed has gone out.
      released.delete(record.element);
      enteredWith.delete(record.element);
    }
  }

  return {
    has: (element) => indexOf(element) !== -1,
    owed: () => hovered.slice(),
    enter,
    leave,
    change(previous, current, eventDetails) {
      const currentByElement = new Map(current.map((record) => [record.element, record] as const));
      const visited = new Set<Element>();

      for (const record of previous) {
        if (!isLive()) {
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
        if (!isLive()) {
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
      // Between change rounds the ledger mirrors the stack order, so the same index
      // almost always matches. Scan only on a mismatch to keep this per-frame path
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
    dispatchToAll(targets, eventName, eventDetails) {
      for (const record of targets) {
        if (!isLive()) {
          return;
        }
        dispatch(record, eventName, eventDetails);
      }
    },
    release(element) {
      released.add(element);
    },
  };
}
