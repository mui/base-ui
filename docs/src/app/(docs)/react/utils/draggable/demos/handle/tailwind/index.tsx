'use client';

import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { GripIcon } from '../../GripIcon';
import { SLOTS, useDashboardWidgets } from '../../dashboardWidgets';
import type { SlotId, WidgetData } from '../../dashboardWidgets';

const CONTROL_CLASS =
  'flex h-8 items-center justify-center border border-neutral-950 bg-white px-3 text-sm leading-none whitespace-nowrap text-neutral-950 select-none hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800 dark:focus-visible:outline-white';

const widgetKind = Draggable.createKind<string>('draggable/handle-widget');

const WIDGET_CLASS =
  'box-border flex min-h-32 w-full flex-col border border-neutral-950 bg-white text-neutral-950 transition-opacity data-[dragging]:opacity-40 data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:border-white dark:bg-neutral-950 dark:text-white dark:data-[drag-preview]:shadow-none focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white';
const HANDLE_CLASS =
  'inline-flex shrink-0 cursor-grab items-center justify-center text-neutral-400 dark:text-neutral-500';

function Widget({
  widget,
  onKeyDown,
}: {
  widget: WidgetData;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>, widgetId: string) => void;
}) {
  return (
    <Draggable.Root
      kind={widgetKind}
      payload={widget.id}
      className={WIDGET_CLASS}
      data-widget-id={widget.id}
      tabIndex={0}
      aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
      onKeyDown={(event) => onKeyDown(event, widget.id)}
    >
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 text-xs leading-4 font-semibold dark:border-neutral-700">
        {/* @highlight-start @focus @padding 2 */}
        <Draggable.Handle className={HANDLE_CLASS}>
          <GripIcon className="shrink-0" />
        </Draggable.Handle>
        {/* @highlight-end */}
        <span>{widget.title}</span>
      </div>
      <div className="flex flex-1 flex-col justify-center px-3 py-2.5">
        <strong className="text-xl leading-6 font-medium">{widget.value}</strong>
        <span className="text-xs leading-4 text-neutral-500 dark:text-neutral-400">
          {widget.detail}
        </span>
      </div>
    </Draggable.Root>
  );
}

function DockSlot({
  id,
  label,
  widget,
  onMoveWidget,
  onWidgetKeyDown,
}: {
  id: SlotId;
  label: string;
  widget: WidgetData | undefined;
  onMoveWidget: (widgetId: string, slot: SlotId) => void;
  onWidgetKeyDown: (event: React.KeyboardEvent<HTMLElement>, widgetId: string) => void;
}) {
  return (
    <Draggable.Target
      role="group"
      aria-label={label}
      className="box-border flex min-h-32 items-stretch data-[empty]:items-center data-[empty]:justify-center data-[empty]:border data-[empty]:border-dashed data-[empty]:border-neutral-300 data-[drag-over]:border-solid data-[drag-over]:border-neutral-950 data-[drag-over]:bg-neutral-100 dark:data-[empty]:border-neutral-700 dark:data-[drag-over]:border-white dark:data-[drag-over]:bg-neutral-800"
      data-empty={widget ? undefined : ''}
      accept={widgetKind}
      canDrop={() => widget === undefined}
      onDraggableDrop={(eventDetails) => onMoveWidget(eventDetails.source.payload, id)}
    >
      {widget ? (
        <Widget widget={widget} onKeyDown={onWidgetKeyDown} />
      ) : (
        <span className="text-xs leading-4 font-medium text-neutral-500 dark:text-neutral-400">
          Drop widget
        </span>
      )}
    </Draggable.Target>
  );
}

export default function HandleDashboard() {
  const { dashboardRef, widgets, moveWidget, onWidgetKeyDown, announcement } =
    useDashboardWidgets();

  const [selectedWidget, setSelectedWidget] = React.useState(widgets[0].id);
  const [selectedSlot, setSelectedSlot] = React.useState<SlotId>('right');

  return (
    <Draggable.Provider>
      <div ref={dashboardRef} className="flex w-full flex-col gap-4 select-none">
        <div role="status" style={visuallyHidden}>
          {announcement}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SLOTS.map((slot) => (
            <DockSlot
              key={slot.id}
              id={slot.id}
              label={slot.label}
              widget={widgets.find((widget) => widget.slot === slot.id)}
              onMoveWidget={moveWidget}
              onWidgetKeyDown={onWidgetKeyDown}
            />
          ))}
        </div>
        <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
          <legend className="mb-2 p-0 text-sm leading-5 font-medium text-neutral-950 dark:text-white">
            Move widget
          </legend>
          <select
            aria-label="Widget"
            className={CONTROL_CLASS}
            value={selectedWidget}
            onChange={(event) => setSelectedWidget(event.target.value)}
          >
            {widgets.map((widget) => (
              <option key={widget.id} value={widget.id}>
                {widget.title}
              </option>
            ))}
          </select>
          <select
            aria-label="Destination"
            className={CONTROL_CLASS}
            value={selectedSlot}
            onChange={(event) => setSelectedSlot(event.target.value as SlotId)}
          >
            {SLOTS.map((slot) => (
              <option
                key={slot.id}
                value={slot.id}
                disabled={widgets.some(
                  (widget) => widget.slot === slot.id && widget.id !== selectedWidget,
                )}
              >
                {slot.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={CONTROL_CLASS}
            onClick={() => moveWidget(selectedWidget, selectedSlot)}
          >
            Move widget
          </button>
        </fieldset>
      </div>
    </Draggable.Provider>
  );
}
