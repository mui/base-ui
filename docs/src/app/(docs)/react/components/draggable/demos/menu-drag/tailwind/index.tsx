'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { useDragDropManager } from '@base-ui/react/use-drag-drop-manager';

type SlotId = 'left' | 'center' | 'right';

interface WidgetData {
  id: string;
  title: string;
  value: string;
  detail: string;
  slot: SlotId;
}

const widgetKind = Draggable.createKind<string>('draggable/menu-widget');

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

function MoreIcon() {
  return (
    <svg
      className="ml-auto shrink-0 text-neutral-500 dark:text-neutral-400"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
    >
      <circle cx="3" cy="7" r="1" fill="currentColor" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
      <circle cx="11" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

const WIDGET_CLASS =
  'box-border flex min-h-32 w-full cursor-grab flex-col border border-neutral-950 bg-white p-0 text-left font-[inherit] text-neutral-950 transition data-[dragging]:opacity-40 motion-safe:data-[drag-preview]:data-ending-style:transition-[translate] motion-safe:data-[drag-preview]:data-ending-style:duration-200 motion-safe:data-[drag-preview]:data-ending-style:ease-[cubic-bezier(0.2,0,0,1)] data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] hover:bg-neutral-100 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:border-white dark:bg-neutral-950 dark:text-white dark:data-[drag-preview]:shadow-none dark:hover:bg-neutral-800 dark:focus-visible:outline-white';
const POPUP_CLASS =
  'box-border min-w-32 border border-neutral-950 bg-white p-1 text-neutral-950 shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] outline-none dark:border-white dark:bg-neutral-950 dark:text-white dark:shadow-none';
const MENU_ITEM_CLASS =
  'flex cursor-default items-center px-2.5 py-1.5 text-sm leading-5 outline-none data-[highlighted]:bg-neutral-950 data-[highlighted]:text-white dark:data-[highlighted]:bg-white dark:data-[highlighted]:text-neutral-950';

function Widget({ widget, onRemove }: { widget: WidgetData; onRemove: (id: string) => void }) {
  const manager = useDragDropManager();
  const ref = React.useRef<HTMLButtonElement | null>(null);
  const [openedByKeyboard, setOpenedByKeyboard] = React.useState(false);
  const startOnCloseRef = React.useRef(false);

  return (
    <Menu.Root
      onOpenChange={(open, eventDetails) => {
        if (open) {
          setOpenedByKeyboard((eventDetails.event as MouseEvent).detail === 0);
        }
      }}
      onOpenChangeComplete={(open) => {
        if (!open && startOnCloseRef.current) {
          startOnCloseRef.current = false;
          manager.startKeyboardDrag(ref.current);
        }
      }}
    >
      <Draggable.Root
        kind={widgetKind}
        payload={widget.id}
        label={`${widget.title} widget`}
        keyboardActivation="manual"
        keyboardInstructions="Press Space to open the widget menu, then choose Move to move it."
        render={
          <Menu.Trigger render={<button ref={ref} type="button" aria-label={widget.title} />} />
        }
        className={WIDGET_CLASS}
      >
        <span className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 text-xs leading-4 font-semibold dark:border-neutral-700">
          <Grip />
          <span>{widget.title}</span>
          <MoreIcon />
        </span>
        <span className="flex flex-1 flex-col justify-center px-3 py-2.5">
          <strong className="text-xl leading-6 font-medium">{widget.value}</strong>
          <span className="text-xs leading-4 text-neutral-500 dark:text-neutral-400">
            {widget.detail}
          </span>
        </span>
      </Draggable.Root>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4}>
          <Menu.Popup className={POPUP_CLASS}>
            {openedByKeyboard && (
              <Menu.Item
                className={MENU_ITEM_CLASS}
                onClick={() => {
                  startOnCloseRef.current = true;
                }}
              >
                Move
              </Menu.Item>
            )}
            <Menu.Item className={MENU_ITEM_CLASS} onClick={() => onRemove(widget.id)}>
              Remove
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function DockSlot({
  id,
  label,
  widget,
  onMoveWidget,
  onRemoveWidget,
}: {
  id: SlotId;
  label: string;
  widget: WidgetData | undefined;
  onMoveWidget: (widgetId: string, slot: SlotId) => void;
  onRemoveWidget: (widgetId: string) => void;
}) {
  return (
    <DropTarget.Root
      className="box-border flex min-h-32 items-stretch data-[empty]:items-center data-[empty]:justify-center data-[empty]:border data-[empty]:border-dashed data-[empty]:border-neutral-300 data-[drag-over]:border-solid data-[drag-over]:border-neutral-950 data-[drag-over]:bg-neutral-100 dark:data-[empty]:border-neutral-700 dark:data-[drag-over]:border-white dark:data-[drag-over]:bg-neutral-800"
      data-empty={widget ? undefined : ''}
      label={label}
      accept={widgetKind}
      canDrop={() => widget === undefined}
      onDrop={({ source }) => onMoveWidget(source.payload, id)}
    >
      {widget ? (
        <Widget widget={widget} onRemove={onRemoveWidget} />
      ) : (
        <span className="text-xs leading-4 font-medium text-neutral-500 dark:text-neutral-400">
          Drop widget
        </span>
      )}
    </DropTarget.Root>
  );
}

export default function WidgetMenuDashboard() {
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
            onRemoveWidget={(widgetId) =>
              setWidgets((currentWidgets) =>
                currentWidgets.filter((widget) => widget.id !== widgetId),
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
