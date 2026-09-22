import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';

export type SlotId = 'left' | 'center' | 'right';

export interface WidgetData {
  id: string;
  title: string;
  value: string;
  detail: string;
  slot: SlotId;
}

export const SLOTS: { id: SlotId; label: string }[] = [
  { id: 'left', label: 'Left dashboard slot' },
  { id: 'center', label: 'Center dashboard slot' },
  { id: 'right', label: 'Right dashboard slot' },
];

export const INITIAL_WIDGETS: WidgetData[] = [
  { id: 'visitors', title: 'Visitors', value: '2,420', detail: 'Last 7 days', slot: 'left' },
  { id: 'conversion', title: 'Conversion', value: '3.8%', detail: 'Up 0.4%', slot: 'center' },
];

/** Move a widget into an empty slot; an occupied slot or unknown widget returns `current`. */
export function moveWidget(current: WidgetData[], widgetId: string, slot: SlotId): WidgetData[] {
  const widget = current.find((item) => item.id === widgetId);
  if (!widget || widget.slot === slot || current.some((item) => item.slot === slot)) {
    return current;
  }
  return current.map((item) => (item.id === widgetId ? { ...item, slot } : item));
}

/** The nearest empty slot in `direction` from the widget's slot, or `undefined`. */
export function findEmptySlot(
  current: WidgetData[],
  widgetId: string,
  direction: -1 | 1,
): SlotId | undefined {
  const widget = current.find((item) => item.id === widgetId);
  if (!widget) {
    return undefined;
  }
  for (
    let i = SLOTS.findIndex((slot) => slot.id === widget.slot) + direction;
    SLOTS[i];
    i += direction
  ) {
    if (!current.some((item) => item.slot === SLOTS[i].id)) {
      return SLOTS[i].id;
    }
  }
  return undefined;
}

/** Widget placement shared by the drop handlers and the keyboard shortcut. */
export function useDashboardWidgets(initialWidgets: WidgetData[] = INITIAL_WIDGETS) {
  const [widgets, setWidgets] = React.useState(initialWidgets);
  const [announcement, setAnnouncement] = React.useState('');
  const focusFrame = useAnimationFrame();

  function handleMoveWidget(widgetId: string, slot: SlotId) {
    const next = moveWidget(widgets, widgetId, slot);
    if (next === widgets) {
      return;
    }
    setWidgets(next);
    const widget = widgets.find((item) => item.id === widgetId)!;
    const target = SLOTS.find((item) => item.id === slot)!;
    setAnnouncement(`${widget.title} moved to ${target.label}.`);
  }

  /** Alt+Arrow moves the focused widget to the nearest empty slot in that direction. */
  function handleWidgetKeyDown(event: React.KeyboardEvent<HTMLElement>, widgetId: string) {
    if (!event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) {
      return;
    }
    event.preventDefault();
    const slot = findEmptySlot(widgets, widgetId, event.key === 'ArrowLeft' ? -1 : 1);
    if (!slot) {
      return;
    }
    handleMoveWidget(widgetId, slot);
    // The widget remounts in its new slot, so focus its replacement after the update.
    const doc = ownerDocument(event.currentTarget);
    focusFrame.request(() => {
      doc.querySelector<HTMLElement>(`[data-widget-id="${widgetId}"]`)?.focus();
    });
  }

  return {
    widgets,
    moveWidget: handleMoveWidget,
    onWidgetKeyDown: handleWidgetKeyDown,
    announcement,
  };
}
