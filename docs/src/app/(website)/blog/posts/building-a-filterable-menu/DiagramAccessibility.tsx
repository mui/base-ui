import * as React from 'react';
import { Kbd } from 'docs/src/components/Kbd/Kbd';
import styles from './DiagramAccessibility.module.css';

export default function DiagramAccessibility() {
  return (
    <div
      className={styles.Container}
      role="img"
      aria-label="The “Edit actions” button opens a dialog containing a searchbox, clear button, and menu. The searchbox’s aria-activedescendant points to the highlighted menu item."
    >
      <div className={styles.Diagram}>
        <div className={styles.Trigger}>
          <div className={styles.Role}>button</div>
          <div>“Edit actions”</div>
          <div className={styles.Note}>aria-haspopup="dialog"</div>
        </div>

        <svg
          className={styles.Connector}
          width="40"
          height="24"
          viewBox="0 0 40 24"
          role="img"
          aria-label="Opens dialog"
          focusable="false"
        >
          <path
            d="M0 12H38M32 6L38 12L32 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className={styles.Dialog}>
          <div className={styles.Header}>
            <div className={styles.Role}>dialog</div>
            <div className={styles.Note}>VoiceOver “dialog, with 2 items”</div>
          </div>

          <div className={styles.Controls}>
            <div className={styles.Searchbox}>
              <div className={styles.Role}>searchbox</div>
              <div>“Filter actions”</div>
              <div className={styles.Relationship}>
                <span className="bui-sr-only">The searchbox’s </span>
                aria-activedescendant
                <span className="bui-sr-only"> points to the highlighted Rename menu item.</span>
              </div>
            </div>
            <div className={styles.Clear}>
              <div className={styles.Role}>button (clear)</div>
              <div className={styles.Note}>Not tabbable</div>
            </div>
          </div>

          <div className={styles.Menu}>
            <svg
              className={styles.SearchboxConnector}
              width="24"
              height="48"
              viewBox="0 0 24 48"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M12 0V46M6 40L12 46L18 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className={styles.Role}>menu</div>
            <ul className={styles.Items}>
              <li className={styles.ActiveItem}>
                <span className={styles.Role}>menuitem</span>
                <span>Rename</span>
              </li>
              <li className={styles.Item}>
                <span className={styles.Role}>menuitem</span>
                <span>Duplicate</span>
              </li>
              <li className={styles.Item}>
                <span className={styles.Role}>menuitem</span>
                <span>Delete</span>
              </li>
            </ul>
            <div className={styles.Note}>
              Keyboard users press <Kbd>↓</Kbd> from the field, while screen reader users start in
              the menu and use their own commands to reach the field.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
