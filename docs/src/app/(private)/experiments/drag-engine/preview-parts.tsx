'use client';
import { Draggable } from '@base-ui/react/draggable';

import * as React from 'react';
import clsx from 'clsx';

import theme from './theme.module.css';
import styles from './preview-parts.module.css';

// The preview parts, one variant per row: no preview, the trigger rendered again in a
// portal, custom content, the trigger rendered again in place, and a table row.
// Drop any of them on the inbox.
//
// A portal moves the preview out of its ancestors, so it passes the theme tokens and
// font they provide.

const itemKind = Draggable.createKind<string>('previewParts:item');

const portalClassName = clsx(theme.tokens, styles.Portal);

const rows = [
  { id: 'a', name: 'Report.pdf', size: '2.4 MB' },
  { id: 'b', name: 'Budget.xlsx', size: '540 KB' },
];

export default function PreviewParts() {
  const [log, setLog] = React.useState<string[]>([]);

  return (
    <Draggable.Provider>
      <div className={clsx(theme.tokens, styles.Root)}>
        <div className={styles.Sources}>
          <Section title="No preview" note="Only the trigger's [data-dragging] style shows.">
            <Draggable.Root kind={itemKind} payload="No preview">
              <Draggable.Trigger className={styles.Card}>Report</Draggable.Trigger>
            </Draggable.Root>
          </Section>

          <Section title="Empty Preview" note="Renders the trigger again, in a portal.">
            <Draggable.Root kind={itemKind} payload="Empty Preview">
              <Draggable.Trigger className={styles.Card}>Report</Draggable.Trigger>
              <Draggable.Portal className={portalClassName}>
                <Draggable.Positioner>
                  <Draggable.Preview />
                </Draggable.Positioner>
              </Draggable.Portal>
            </Draggable.Root>
          </Section>

          <Section title="Custom Preview" note="Its own content, under the pointer.">
            <Draggable.Root kind={itemKind} payload="Custom Preview">
              <Draggable.Trigger className={styles.Card}>Report</Draggable.Trigger>
              <Draggable.Portal className={portalClassName}>
                <Draggable.Positioner offset={{ x: -12, y: -12 }}>
                  <Draggable.Preview className={styles.Badge}>
                    <LiveSeconds /> Moving “Report”
                  </Draggable.Preview>
                </Draggable.Positioner>
              </Draggable.Portal>
            </Draggable.Root>
          </Section>

          <Section
            title="Without Portal"
            note="Stays beside the trigger, so the column's rules still style it."
          >
            <div className={styles.Tinted}>
              <Draggable.Root kind={itemKind} payload="Without Portal">
                <Draggable.Trigger className={styles.Card}>Report</Draggable.Trigger>
                <Draggable.Positioner>
                  <Draggable.Preview />
                </Draggable.Positioner>
              </Draggable.Root>
            </div>
          </Section>

          <Section title="Table row" note="The positioner renders a table around the row.">
            <table className={styles.Table}>
              <TableColumns />
              <tbody>
                {rows.map((row) => (
                  <Draggable.Root key={row.id} kind={itemKind} payload={row.name}>
                    <Draggable.Trigger render={<tr className={styles.Row} />}>
                      <td>{row.name}</td>
                      <td>{row.size}</td>
                    </Draggable.Trigger>
                    <Draggable.Portal className={portalClassName}>
                      <Draggable.Positioner render={<table className={styles.Table} />}>
                        <TableColumns />
                        <tbody>
                          <Draggable.Preview />
                        </tbody>
                      </Draggable.Positioner>
                    </Draggable.Portal>
                  </Draggable.Root>
                ))}
              </tbody>
            </table>
          </Section>
        </div>

        <Draggable.Target
          accept={itemKind}
          className={styles.Inbox}
          onDraggableDrop={(eventDetails) => {
            const name = eventDetails.source.payload;
            setLog((previous) => [name, ...previous].slice(0, 5));
          }}
        >
          <strong>Inbox</strong>
          {log.length === 0 ? (
            <span className={styles.Note}>Drop here</span>
          ) : (
            <ol className={styles.Log}>
              {log.map((entry, index) => (
                <li key={index}>{entry}</li>
              ))}
            </ol>
          )}
        </Draggable.Target>
      </div>
    </Draggable.Provider>
  );
}

function Section(props: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className={styles.Section}>
      <h2 className={styles.Title}>{props.title}</h2>
      <p className={styles.Note}>{props.note}</p>
      {props.children}
    </section>
  );
}

// A separate table lays out its own columns, so both tables share these widths.
function TableColumns() {
  return (
    <colgroup>
      <col className={styles.NameColumn} />
      <col className={styles.SizeColumn} />
    </colgroup>
  );
}

// State inside the preview updates while it is dragged.
function LiveSeconds() {
  const [seconds, setSeconds] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  return <span className={styles.Seconds}>{seconds}s</span>;
}
