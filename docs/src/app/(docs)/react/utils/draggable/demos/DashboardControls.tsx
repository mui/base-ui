'use client';
import * as React from 'react';
import { SLOTS, type SlotId, type WidgetData } from './dashboardWidgets';

/** The keyboard and click alternative to dragging a widget into a slot. */
export function DashboardControls({
  widgets,
  onMoveWidget,
  className,
}: {
  widgets: WidgetData[];
  onMoveWidget: (widgetId: string, slot: SlotId) => void;
  className?: string;
}) {
  const movableWidgets = widgets.filter((widget) => !widget.locked);
  const [selectedWidget, setSelectedWidget] = React.useState(movableWidgets[0].id);
  const [destination, setDestination] = React.useState<SlotId>('right');

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        onMoveWidget(selectedWidget, destination);
      }}
    >
      <label>
        Widget{' '}
        <select value={selectedWidget} onChange={(event) => setSelectedWidget(event.target.value)}>
          {movableWidgets.map((widget) => (
            <option key={widget.id} value={widget.id}>
              {widget.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Move to{' '}
        <select
          value={destination}
          onChange={(event) => setDestination(event.target.value as SlotId)}
        >
          {SLOTS.map((slot) => (
            <option
              key={slot.id}
              value={slot.id}
              disabled={widgets.some((widget) => widget.slot === slot.id)}
            >
              {slot.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Move widget</button>
    </form>
  );
}
