'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { GripIcon } from '../../GripIcon';
import { SLOTS, useDashboardWidgets } from '../../dashboardWidgets';
import type { SlotId, WidgetData } from '../../dashboardWidgets';

import styles from '../../handle.module.css';
import controlStyles from '../../hero.module.css';

const widgetKind = Draggable.createKind<string>('draggable/handle-widget');

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
      className={styles.Widget}
      data-widget-id={widget.id}
      tabIndex={0}
      aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
      onKeyDown={(event) => onKeyDown(event, widget.id)}
    >
      <div className={styles.WidgetHeader}>
        {/* @highlight-start @focus @padding 2 */}
        <Draggable.Handle className={styles.Handle}>
          <GripIcon className={styles.Grip} />
        </Draggable.Handle>
        {/* @highlight-end */}
        <span>{widget.title}</span>
      </div>
      <div className={styles.WidgetBody}>
        <strong>{widget.value}</strong>
        <span>{widget.detail}</span>
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
      className={styles.Slot}
      data-empty={widget ? undefined : ''}
      accept={widgetKind}
      canDrop={() => widget === undefined}
      onDraggableDrop={(eventDetails) => onMoveWidget(eventDetails.source.payload, id)}
    >
      {widget ? (
        <Widget widget={widget} onKeyDown={onWidgetKeyDown} />
      ) : (
        <span className={styles.Empty}>Drop widget</span>
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
      <div ref={dashboardRef} className={styles.Root}>
        <div role="status" style={visuallyHidden}>
          {announcement}
        </div>
        <div className={styles.Grid}>
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
        <fieldset className={controlStyles.Controls}>
          <legend className={controlStyles.Legend}>Move widget</legend>
          <select
            aria-label="Widget"
            className={controlStyles.Button}
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
            className={controlStyles.Button}
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
            className={controlStyles.Button}
            onClick={() => moveWidget(selectedWidget, selectedSlot)}
          >
            Move widget
          </button>
        </fieldset>
      </div>
    </Draggable.Provider>
  );
}
