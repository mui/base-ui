import * as React from 'react';

export default function DiagramAccessibility() {
  const id = React.useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const arrowId = `${id}-arrow`;
  const activeDescendantArrowId = `${id}-active-descendant-arrow`;

  return (
    <svg
      width="848"
      height="302"
      viewBox="16 16 848 302"
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      fontFamily="system-ui, sans-serif"
    >
      <title id={titleId}>Accessibility structure of a filterable menu</title>
      <desc id={descriptionId}>
        The Edit actions button opens a dialog containing a Filter actions searchbox, a Clear button
        outside the tab order, and a menu. VoiceOver announces the dialog with two items. The
        searchbox's aria-activedescendant points to the highlighted Rename menu item.
      </desc>
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path fill="var(--gray-t1)" d="M0,0 L10,5 L0,10 z" />
        </marker>
        <marker
          id={activeDescendantArrowId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path fill="var(--indigo-t1)" d="M0,0 L10,5 L0,10 z" />
        </marker>
      </defs>
      <rect
        fill="none"
        stroke="var(--gray-t2)"
        strokeOpacity="0.5"
        strokeWidth="1"
        x="20"
        y="121"
        width="200"
        height="92"
        rx="4"
      />
      <text fill="var(--indigo-t1)" fontSize="14" x="40" y="151">
        button
      </text>
      <text fill="var(--gray-t2)" fontSize="15" x="40" y="171">
        "Edit actions"
      </text>
      <text fill="var(--gray-t1)" fontSize="14" x="40" y="191">
        aria-haspopup="dialog"
      </text>
      <path
        stroke="var(--gray-t1)"
        strokeWidth="1.25"
        fill="none"
        d="M220 167 H282"
        markerEnd={`url(#${arrowId})`}
      />
      <text fill="var(--gray-t1)" fontSize="14" x="228" y="158">
        opens
      </text>
      <rect
        fill="none"
        stroke="var(--gray-t2)"
        strokeOpacity="0.5"
        strokeWidth="1"
        x="290"
        y="20"
        width="570"
        height="294"
        rx="4"
      />
      <text fill="var(--indigo-t1)" fontSize="14" x="310" y="50">
        dialog
      </text>
      <text fill="var(--gray-t1)" fontSize="14" x="364" y="50">
        VoiceOver says "dialog, with 2 items"
      </text>
      <rect
        fill="var(--indigo-t1)"
        fillOpacity="0.1"
        stroke="var(--indigo-t1)"
        strokeWidth="1"
        x="310"
        y="66"
        width="300"
        height="62"
        rx="4"
      />
      <text fill="var(--indigo-t1)" fontSize="14" x="326" y="90">
        searchbox
      </text>
      <text fill="var(--gray-t2)" fontSize="15" x="326" y="110">
        "Filter actions"
      </text>
      <rect
        fill="none"
        stroke="var(--gray-t2)"
        strokeOpacity="0.24"
        strokeWidth="1"
        x="630"
        y="66"
        width="210"
        height="62"
        rx="4"
      />
      <text fill="var(--indigo-t1)" fontSize="14" x="646" y="90">
        button · Clear
      </text>
      <text fill="var(--gray-t1)" fontSize="14" x="646" y="110">
        Not in the tab order
      </text>
      {/* Leave a gap in the menu's top border for the aria-activedescendant label. */}
      <path
        fill="none"
        stroke="var(--gray-t2)"
        strokeOpacity="0.24"
        strokeWidth="1"
        d="M568 148 H836 A4 4 0 0 1 840 152 V290 A4 4 0 0 1 836 294 H314 A4 4 0 0 1 310 290 V152 A4 4 0 0 1 314 148 H408"
      />
      <text fill="var(--indigo-t1)" fontSize="14" x="326" y="172">
        menu
      </text>
      <rect
        fill="var(--indigo-t1)"
        fillOpacity="0.1"
        stroke="var(--indigo-t1)"
        strokeWidth="1"
        x="326"
        y="186"
        width="160"
        height="40"
        rx="4"
      />
      <text fill="var(--gray-t2)" fontSize="15" x="340" y="211">
        menuitem Rename
      </text>
      <rect
        fill="none"
        stroke="var(--gray-t2)"
        strokeOpacity="0.24"
        strokeWidth="1"
        x="500"
        y="186"
        width="160"
        height="40"
        rx="4"
      />
      <text fill="var(--gray-t2)" fontSize="15" x="514" y="211">
        menuitem Duplicate
      </text>
      <rect
        fill="none"
        stroke="var(--gray-t2)"
        strokeOpacity="0.24"
        strokeWidth="1"
        x="674"
        y="186"
        width="150"
        height="40"
        rx="4"
      />
      <text fill="var(--gray-t2)" fontSize="15" x="688" y="211">
        menuitem Delete
      </text>
      <text fill="var(--gray-t1)" fontSize="14" x="326" y="256">
        Keyboard users press Down Arrow from the field, while screen
      </text>
      <text fill="var(--gray-t1)" fontSize="14" x="326" y="276">
        reader users start here and use their own commands to reach the field.
      </text>
      <path
        stroke="var(--indigo-t1)"
        strokeWidth="1.25"
        fill="none"
        d="M386 128 C 406 150, 406 160, 406 182"
        markerEnd={`url(#${activeDescendantArrowId})`}
      />
      <text fill="var(--indigo-t1)" fontSize="14" x="416" y="152">
        aria-activedescendant
      </text>
    </svg>
  );
}
