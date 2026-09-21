import * as React from 'react';

export type SlotId = 'left' | 'center' | 'right';

export interface WidgetData {
  id: string;
  title: string;
  value: string;
  detail: string;
  slot: SlotId;
  locked?: boolean;
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

/** Widget placement shared by the drop handlers and the "Move to" form. */
export function useDashboardWidgets(initialWidgets: WidgetData[] = INITIAL_WIDGETS) {
  const [widgets, setWidgets] = React.useState(initialWidgets);
  const [announcement, setAnnouncement] = React.useState('');

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

  return { widgets, moveWidget: handleMoveWidget, announcement };
}
