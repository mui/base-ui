'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';

type SlotId = 'left' | 'center' | 'right';

interface WidgetData {
  id: string;
  title: string;
  value: string;
  detail: string;
  slot: SlotId;
}

const widgetKind = Draggable.createKind<string>('draggable/keyboard-widget');

const SLOTS: { id: SlotId; label: string }[] = [
  { id: 'left', label: 'Left dashboard slot' },
  { id: 'center', label: 'Center dashboard slot' },
  { id: 'right', label: 'Right dashboard slot' },
];

const INITIAL_WIDGETS: WidgetData[] = [
  { id: 'visitors', title: 'Visitors', value: '2,420', detail: 'Last 7 days', slot: 'left' },
  { id: 'conversion', title: 'Conversion', value: '3.8%', detail: 'Up 0.4%', slot: 'center' },
];

function Grip() {
  return (
    <svg
      className="shrink-0 text-neutral-400 dark:text-neutral-500"
      width="8"
      height="14"
      viewBox="0 0 8 14"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <circle cx="2" cy="2" r="1.2" />
        <circle cx="6" cy="2" r="1.2" />
        <circle cx="2" cy="7" r="1.2" />
        <circle cx="6" cy="7" r="1.2" />
        <circle cx="2" cy="12" r="1.2" />
        <circle cx="6" cy="12" r="1.2" />
      </g>
    </svg>
  );
}

const WIDGET_CLASS =
  'box-border flex min-h-32 w-full cursor-grab flex-col border border-neutral-950 bg-white text-neutral-950 transition data-[dragging]:opacity-40 motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:data-[drag-preview]:shadow-none dark:hover:bg-neutral-800 dark:focus-visible:outline-white';

function Widget({ widget }: { widget: WidgetData }) {
  return (
    <Draggable.Root
      label={`${widget.title} widget`}
      kind={widgetKind}
      payload={widget.id}
      role="button"
      className={WIDGET_CLASS}
    >
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 text-xs leading-4 font-semibold dark:border-neutral-700">
        <Grip />
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
    <DropTarget.Root
      className="box-border flex min-h-32 items-stretch data-[empty]:items-center data-[empty]:justify-center data-[empty]:border data-[empty]:border-dashed data-[empty]:border-neutral-300 data-[over]:border-solid data-[over]:border-neutral-950 data-[over]:bg-neutral-100 dark:data-[empty]:border-neutral-700 dark:data-[over]:border-white dark:data-[over]:bg-neutral-800"
      data-empty={widget ? undefined : ''}
      label={label}
      accept={widgetKind}
      canDrop={() => widget === undefined}
      onDrop={({ source }) => onMoveWidget(source.payload, id)}
    >
      {widget ? (
        <Widget widget={widget} />
      ) : (
        <span className="text-xs leading-4 font-medium text-neutral-500 dark:text-neutral-400">
          Drop widget
        </span>
      )}
    </DropTarget.Root>
  );
}

export default function KeyboardDashboard() {
  const [widgets, setWidgets] = React.useState<WidgetData[]>(INITIAL_WIDGETS);

  function moveWidget(widgetId: string, slot: SlotId) {
    setWidgets((currentWidgets) =>
      currentWidgets.map((widget) => (widget.id === widgetId ? { ...widget, slot } : widget)),
    );
  }

  return (
    <div className="w-full select-none">
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
