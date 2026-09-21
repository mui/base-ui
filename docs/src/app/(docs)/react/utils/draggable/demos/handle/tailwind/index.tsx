'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { DashboardControls } from '../../DashboardControls';
import { dashboardControlsClassName } from '../../dashboardControlsTailwind';
import { GripIcon } from '../../GripIcon';
import { SLOTS, useDashboardWidgets, type SlotId, type WidgetData } from '../../dashboardWidgets';

const widgetKind = Draggable.createKind<string>('draggable/handle-widget');

const WIDGET_CLASS =
  'box-border flex min-h-32 w-full flex-col border border-neutral-950 bg-white text-neutral-950 transition-opacity data-[dragging]:opacity-40 motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:border-white dark:bg-neutral-950 dark:text-white dark:data-[drag-preview]:shadow-none';
const HANDLE_CLASS =
  'm-0 inline-flex shrink-0 cursor-grab items-center justify-center border-0 bg-transparent p-0 text-neutral-400 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:text-neutral-500 dark:focus-visible:outline-white';

function Widget({ widget }: { widget: WidgetData }) {
  return (
    <Draggable.Root kind={widgetKind} payload={widget.id} className={WIDGET_CLASS}>
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 text-xs leading-4 font-semibold dark:border-neutral-700">
        {/* @highlight-start */}
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

function HandleDashboardContent() {
  const { widgets, moveWidget, announcement } = useDashboardWidgets();

  return (
    <div className="flex w-full flex-col gap-4 select-none">
      <DashboardControls
        className={dashboardControlsClassName}
        widgets={widgets}
        onMoveWidget={moveWidget}
      />
      <div role="status" className="sr-only">
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
          />
        ))}
      </div>
    </div>
  );
}

export default function HandleDashboard() {
  return (
    <Draggable.Provider>
      <HandleDashboardContent />
    </Draggable.Provider>
  );
}
