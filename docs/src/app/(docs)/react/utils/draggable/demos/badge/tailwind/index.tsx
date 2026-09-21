'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { DashboardControls } from '../../DashboardControls';
import { GripIcon } from '../../GripIcon';
import { SLOTS, useDashboardWidgets, type SlotId, type WidgetData } from '../../dashboardWidgets';

const widgetKind = Draggable.createKind<string>('draggable/preview-widget');

const WIDGET_CLASS =
  'box-border flex min-h-32 w-full cursor-grab flex-col border border-neutral-950 bg-white text-neutral-950 transition data-[dragging]:opacity-40 hover:bg-neutral-100 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800';
const BADGE_CLASS =
  'inline-flex items-center gap-1.5 whitespace-nowrap border border-neutral-950 bg-white px-2 py-1 text-xs leading-4 font-semibold text-neutral-950 shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none';
const BADGE_VALUE_CLASS = 'bg-neutral-950 px-1 text-white dark:bg-white dark:text-neutral-950';

function Widget({ widget }: { widget: WidgetData }) {
  return (
    <Draggable.Root kind={widgetKind} payload={widget.id} className={WIDGET_CLASS}>
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 text-xs leading-4 font-semibold dark:border-neutral-700">
        <GripIcon className="shrink-0 text-neutral-400 dark:text-neutral-500" />
        <span>{widget.title}</span>
      </div>
      <div className="flex flex-1 flex-col justify-center px-3 py-2.5">
        <strong className="text-xl leading-6 font-medium">{widget.value}</strong>
        <span className="text-xs leading-4 text-neutral-500 dark:text-neutral-400">
          {widget.detail}
        </span>
      </div>
      {/* @highlight-start */}
      <Draggable.Preview className={BADGE_CLASS} offset="pointer">
        <span className={BADGE_VALUE_CLASS}>{widget.value}</span>
        {widget.title}
      </Draggable.Preview>
      {/* @highlight-end */}
    </Draggable.Root>
  );
}

function DockSlot({
  id,
  label,
  widget,
  onMoveWidget,
}: {
  id: SlotId;
  label: string;
  widget: WidgetData | undefined;
  onMoveWidget: (widgetId: string, slot: SlotId) => void;
}) {
  return (
    <Draggable.Target
      role="group"
      aria-label={label}
      className="box-border flex min-h-32 items-stretch data-[empty]:items-center data-[empty]:justify-center data-[empty]:border data-[empty]:border-dashed data-[empty]:border-neutral-300 data-[drag-over]:border-solid data-[drag-over]:border-neutral-950 data-[drag-over]:bg-neutral-100 dark:data-[empty]:border-neutral-700 dark:data-[drag-over]:border-white dark:data-[drag-over]:bg-neutral-800"
      data-empty={widget ? undefined : ''}
      accept={widgetKind}
      canDrop={() => widget === undefined}
      onDraggableDrop={({ source }) => onMoveWidget(source.payload, id)}
    >
      {widget ? (
        <Widget widget={widget} />
      ) : (
        <span className="text-xs leading-4 font-medium text-neutral-500 dark:text-neutral-400">
          Drop widget
        </span>
      )}
    </Draggable.Target>
  );
}

export default function CustomPreviewDashboard() {
  const { widgets, moveWidget, announcement } = useDashboardWidgets();

  return (
    <Draggable.Provider>
      <div className="flex w-full flex-col gap-4 select-none">
        <DashboardControls
          className="flex flex-wrap items-end gap-2 text-sm"
          widgets={widgets}
          onMoveWidget={moveWidget}
        />
        <div role="status">{announcement}</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SLOTS.map((slot) => (
            <DockSlot
              key={slot.id}
              id={slot.id}
              label={slot.label}
              widget={widgets.find((widget) => widget.slot === slot.id)}
              onMoveWidget={moveWidget}
            />
          ))}
        </div>
      </div>
    </Draggable.Provider>
  );
}
