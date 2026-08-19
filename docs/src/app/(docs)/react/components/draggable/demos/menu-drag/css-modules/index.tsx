'use client';
import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { Draggable } from '@base-ui/react/draggable';
import { DropTarget } from '@base-ui/react/drop-target';
import { useDragDropManager } from '@base-ui/react/use-drag-drop-manager';
import styles from '../../menu-drag.module.css';

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
    <svg className={styles.Grip} width="8" height="14" viewBox="0 0 8 14" aria-hidden="true">
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
    <svg className={styles.MoreIcon} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <circle cx="3" cy="7" r="1" fill="currentColor" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
      <circle cx="11" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

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
      // @highlight-start
      onOpenChangeComplete={(open) => {
        if (!open && startOnCloseRef.current) {
          startOnCloseRef.current = false;
          manager.startKeyboardDrag(ref.current);
        }
      }}
      // @highlight-end
    >
      <Draggable.Root
        kind={widgetKind}
        payload={widget.id}
        label={`${widget.title} widget`}
        // @highlight-start
        keyboardActivation="manual"
        keyboardInstructions="Press Space to open the widget menu, then choose Move to move it."
        // @highlight-end
        render={
          <Menu.Trigger render={<button ref={ref} type="button" aria-label={widget.title} />} />
        }
        className={styles.Widget}
      >
        <span className={styles.WidgetHeader}>
          <Grip />
          <span>{widget.title}</span>
          <MoreIcon />
        </span>
        <span className={styles.WidgetBody}>
          <strong>{widget.value}</strong>
          <span>{widget.detail}</span>
        </span>
      </Draggable.Root>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4}>
          <Menu.Popup className={styles.Popup}>
            {openedByKeyboard && (
              <Menu.Item
                className={styles.MenuItem}
                onClick={() => {
                  startOnCloseRef.current = true;
                }}
              >
                Move
              </Menu.Item>
            )}
            <Menu.Item className={styles.MenuItem} onClick={() => onRemove(widget.id)}>
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
      className={styles.Slot}
      data-empty={widget ? undefined : ''}
      label={label}
      accept={widgetKind}
      canDrop={() => widget === undefined}
      onDrop={({ source }) => onMoveWidget(source.payload, id)}
    >
      {widget ? (
        <Widget widget={widget} onRemove={onRemoveWidget} />
      ) : (
        <span className={styles.Empty}>Drop widget</span>
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
    <div className={styles.Root}>
      <div className={styles.Grid}>
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
