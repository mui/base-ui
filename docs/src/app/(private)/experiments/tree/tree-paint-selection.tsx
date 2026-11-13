'use client';
import * as React from 'react';
import { Tree } from '@base-ui/react/tree';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { contains, getTarget } from '@base-ui/utils/shadowDom';

import styles from './tree-paint-selection.module.css';

type Actions = Tree.Root.Actions;

/**
 * Paint selection built on the public Tree API: press a checkbox with a mouse or
 * pen, then drag across other checkboxes to give them the state the first one
 * toggles to. Dragging back restores the checkboxes painted after the one the
 * pointer returns to. Touch keeps scrolling.
 *
 * The list is flat: in a hierarchy, checking a folder also checks its contents,
 * so painting across nested rows would keep fighting the selection propagation.
 */
export default function TreePaintSelection() {
  const actionsRef = React.useRef<Actions>(null);
  const [changeCount, setChangeCount] = React.useState(0);
  const handlePointerDown = usePaintSelection(actionsRef);

  return (
    <div className={styles.Page}>
      <Tree.Root
        items={ITEMS}
        selectionMode="multiple"
        actionsRef={actionsRef}
        onSelectedItemsChange={() => setChangeCount((count) => count + 1)}
      >
        <Tree.List aria-label="Files" className={styles.Tree} onPointerDown={handlePointerDown}>
          {renderItem}
        </Tree.List>
      </Tree.Root>
      <p className={styles.Log}>
        <code>onSelectedItemsChange</code> calls: {changeCount}
      </p>
    </div>
  );
}

/**
 * Returns the `onPointerDown` handler of a `Tree.List` that paints the checkboxes
 * of its rows. Each painted checkbox goes through `actionsRef.setItemSelection()`,
 * so it calls `onSelectedItemsChange` on its own.
 */
function usePaintSelection(actionsRef: React.RefObject<Actions | null>) {
  const cleanupRef = React.useRef<(() => void) | null>(null);
  React.useEffect(() => () => cleanupRef.current?.(), []);

  return (event: React.PointerEvent<HTMLElement>) => {
    const actions = actionsRef.current;
    const list = event.currentTarget;
    const first = findCheckbox(list, getTarget(event.nativeEvent) as Element | null);
    if (
      actions == null ||
      first == null ||
      event.defaultPrevented ||
      event.button !== 0 ||
      !event.isPrimary ||
      // Touch keeps scrolling the list.
      (event.pointerType !== 'mouse' && event.pointerType !== 'pen') ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }
    cleanupRef.current?.();

    const doc = ownerDocument(list);
    const { pointerId } = event;
    // Every painted checkbox takes the state the first one toggles to.
    const checked = first.checkbox.getAttribute('aria-checked') !== 'true';
    // Retraced checkboxes return to their state from before the gesture.
    const original = actions.getSelectedItemIds();
    // The painted items, in the order the pointer crossed them.
    const trail: Tree.ItemId[] = [];
    const origin = { x: event.clientX, y: event.clientY };
    let previous = origin;
    let painting = false;

    const paint = (itemId: Tree.ItemId) => {
      const index = trail.indexOf(itemId);
      if (index === -1) {
        trail.push(itemId);
        actions.setItemSelection(itemId, checked);
        return;
      }
      // Moving back over a painted checkbox restores the ones painted after it.
      for (const restoredId of trail.splice(index + 1)) {
        actions.setItemSelection(restoredId, original.has(restoredId));
      }
    };

    const move = (nativeEvent: PointerEvent) => {
      if (nativeEvent.pointerId !== pointerId) {
        return;
      }
      if (nativeEvent.buttons % 2 === 0) {
        cleanup();
        return;
      }
      const point = { x: nativeEvent.clientX, y: nativeEvent.clientY };
      if (!painting) {
        // A press that barely moves stays a click.
        if (Math.hypot(point.x - origin.x, point.y - origin.y) < 4) {
          return;
        }
        painting = true;
        paint(first.itemId);
      }
      nativeEvent.preventDefault();
      // Samples the segment since the last move, so a fast pointer doesn't skip a row.
      const steps = Math.ceil(Math.hypot(point.x - previous.x, point.y - previous.y) / 4);
      for (let step = 1; step <= steps; step += 1) {
        const crossed = findCheckbox(
          list,
          doc.elementFromPoint(
            previous.x + ((point.x - previous.x) * step) / steps,
            previous.y + ((point.y - previous.y) * step) / steps,
          ),
        );
        if (crossed != null) {
          paint(crossed.itemId);
        }
      }
      previous = point;
    };

    const end = (nativeEvent: PointerEvent) => {
      if (nativeEvent.pointerId !== pointerId) {
        return;
      }
      removeGestureListeners();
      // A press that didn't paint leaves its click to toggle the checkbox.
      if (!painting) {
        cleanup();
      }
    };

    // The click that ends a gesture would toggle the checkbox it ends on.
    const preventClick = (nativeEvent: MouseEvent) => {
      if (painting) {
        nativeEvent.preventDefault();
        nativeEvent.stopPropagation();
      }
      cleanup();
    };

    const preventDefault = (nativeEvent: Event) => nativeEvent.preventDefault();

    const removeGestureListeners = mergeCleanups(
      addEventListener(doc, 'pointermove', move, { passive: false }),
      addEventListener(doc, 'pointerup', end),
      addEventListener(doc, 'pointercancel', () => cleanup()),
      addEventListener(doc, 'selectstart', preventDefault),
      addEventListener(ownerWindow(list), 'blur', () => cleanup()),
    );
    // Kept until the click that follows the release, or the next press if none does.
    const removeClickGuard = mergeCleanups(
      addEventListener(doc, 'click', preventClick, true),
      addEventListener(doc, 'pointerdown', () => cleanup(), true),
    );
    function cleanup() {
      removeGestureListeners();
      removeClickGuard();
      if (cleanupRef.current === cleanup) {
        cleanupRef.current = null;
      }
    }
    cleanupRef.current = cleanup;
  };
}

/** The enabled checkbox of a row of `list` that contains `target`. */
function findCheckbox(list: HTMLElement, target: Element | null) {
  const checkbox = target?.closest<HTMLElement>('[role="checkbox"]');
  const row = checkbox?.closest<HTMLElement>('[role="row"]');
  const itemId = row?.dataset.itemId;
  if (
    checkbox == null ||
    itemId == null ||
    !contains(list, checkbox) ||
    checkbox.hasAttribute('data-disabled')
  ) {
    return null;
  }
  return { checkbox, itemId };
}

function renderItem(item: Tree.DefaultItem) {
  return (
    <Tree.Item itemId={item.id} className={styles.Item}>
      <Tree.ItemContent className={styles.ItemContent}>
        <Tree.ItemCheckbox className={styles.Checkbox}>
          <Tree.ItemCheckboxIndicator className={styles.CheckboxIndicator} keepMounted>
            <CheckIcon className={styles.CheckIcon} />
          </Tree.ItemCheckboxIndicator>
        </Tree.ItemCheckbox>
        <span className={styles.Label}>{item.label}</span>
      </Tree.ItemContent>
    </Tree.Item>
  );
}

const ITEMS: Tree.DefaultItem[] = [
  { id: 'sunset', label: 'Sunset.jpg' },
  { id: 'mountains', label: 'Mountains.png' },
  { id: 'beach', label: 'Beach.jpg' },
  { id: 'family-dinner', label: 'Family Dinner.jpg', disabled: true },
  { id: 'forest', label: 'Forest.jpg' },
  { id: 'city-lights', label: 'City Lights.png' },
  { id: 'desert', label: 'Desert.jpg' },
  { id: 'harbor', label: 'Harbor.jpg' },
  { id: 'snowfall', label: 'Snowfall.png' },
  { id: 'meadow', label: 'Meadow.jpg' },
  { id: 'canyon', label: 'Canyon.jpg' },
  { id: 'lighthouse', label: 'Lighthouse.png' },
  { id: 'waterfall', label: 'Waterfall.jpg' },
  { id: 'aurora', label: 'Aurora.jpg' },
  { id: 'vineyard', label: 'Vineyard.png' },
  { id: 'bridge', label: 'Bridge.jpg' },
];

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" {...props}>
      <path d="M9.854 3.146a.5.5 0 010 .708l-4.5 4.5a.5.5 0 01-.708 0l-2-2a.5.5 0 01.708-.708L5 7.293l4.146-4.147a.5.5 0 01.708 0z" />
    </svg>
  );
}
