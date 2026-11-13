import * as React from 'react';
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

const INITIAL_WIDGETS: WidgetData[] = [
  { id: 'visitors', title: 'Visitors', value: '2,420', detail: 'Last 7 days', slot: 'left' },
  { id: 'conversion', title: 'Conversion', value: '3.8%', detail: 'Up 0.4%', slot: 'center' },
];

/** Find the nearest empty slot in `direction` from the widget, or `undefined` if there is none. */
function findEmptySlot(
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
export function useDashboardWidgets() {
  const [widgets, setWidgets] = React.useState(INITIAL_WIDGETS);
  const [announcement, setAnnouncement] = React.useState('');
  const focusFrame = useAnimationFrame();
  const dashboardRef = React.useRef<HTMLDivElement | null>(null);

  /** Move a widget into an empty slot. Does nothing if the slot is taken. */
  function moveWidget(widgetId: string, slot: SlotId) {
    const widget = widgets.find((item) => item.id === widgetId);
    // A widget's own slot counts as taken, so a drop in place does nothing too.
    if (!widget || widgets.some((item) => item.slot === slot)) {
      return;
    }
    setWidgets(widgets.map((item) => (item === widget ? { ...item, slot } : item)));
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
    moveWidget(widgetId, slot);
    // The widget remounts in its new slot, so focus its replacement after the update.
    focusFrame.request(() => {
      dashboardRef.current?.querySelector<HTMLElement>(`[data-widget-id="${widgetId}"]`)?.focus();
    });
  }

  return {
    dashboardRef,
    widgets,
    moveWidget,
    onWidgetKeyDown: handleWidgetKeyDown,
    announcement,
  };
}
