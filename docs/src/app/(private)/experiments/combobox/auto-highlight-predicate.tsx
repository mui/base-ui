'use client';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import styles from './auto-highlight-predicate.module.css';

// Mirrors https://github.com/mui/base-ui/issues/5205: spacing tokens where typing "1"
// must not auto-highlight "12", but typing "12" should highlight the exact "12" token.
const TOKENS = ['1', '2', '4', '8', '12', '16', '24', '32', '48', '64', '128'];

export default function Experiment() {
  return (
    <div className={styles.Container}>
      <h1>autoHighlight predicate</h1>
      <p>
        Type <kbd>3</kbd> then press <kbd>Enter</kbd>: &quot;3&quot; prefix-matches the
        &quot;32&quot; token but is not itself a token, so the predicate combobox keeps the raw text
        while the boolean combobox auto-highlights &quot;32&quot; and selects it. Then try
        <kbd>32</kbd>: both highlight and select the exact token.
      </p>
      <div className={styles.Row}>
        <TokenCombobox label="autoHighlight (boolean)" autoHighlight />
        <TokenCombobox
          label="autoHighlight (exact-match predicate)"
          autoHighlight={(item: string, query: string) =>
            item.toLowerCase() === query.toLowerCase()
          }
        />
      </div>
    </div>
  );
}

function TokenCombobox(props: {
  label: string;
  autoHighlight: boolean | ((item: string, query: string) => boolean);
}) {
  const [committed, setCommitted] = React.useState<string | null>(null);
  const [committedIsToken, setCommittedIsToken] = React.useState(false);

  return (
    <div className={styles.Column}>
      <div className={styles.Label}>{props.label}</div>
      <Combobox.Root
        items={TOKENS}
        autoHighlight={props.autoHighlight}
        onValueChange={(value) => {
          setCommitted(value);
          setCommittedIsToken(true);
        }}
      >
        <Combobox.Input
          className={styles.Input}
          placeholder="Spacing…"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.defaultPrevented) {
              // No highlighted item consumed Enter: treat as raw text.
              setCommitted(event.currentTarget.value);
              setCommittedIsToken(false);
            }
          }}
        />
        <Combobox.Portal>
          <Combobox.Positioner className={styles.Positioner} sideOffset={4}>
            <Combobox.Popup className={styles.Popup}>
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item} className={styles.Item}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      <div className={styles.Result}>
        Committed:{' '}
        {committed === null ? (
          <em>none</em>
        ) : (
          <span className={committedIsToken ? styles.Token : styles.RawText}>
            {committedIsToken ? `token(${committed})` : `"${committed}"`}
          </span>
        )}
      </div>
    </div>
  );
}
