'use client';
import * as React from 'react';
import { Autocomplete } from '@base-ui-components/react/autocomplete';
import styles from './index.module.css';

export default function ExampleMentionsAutocomplete() {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const lastTextStateRef = React.useRef<{ value: string; start: number; end: number }>({
    value: '',
    start: 0,
    end: 0,
  });

  const { startsWith } = Autocomplete.useFilter({ sensitivity: 'base' });

  const items = React.useMemo(() => {
    if (query === '') {
      return USERS;
    }
    return USERS.filter((user) => startsWith(user.username, query));
  }, [query, startsWith]);

  function insertMention(
    username: string,
    override?: { value: string; start: number; end: number },
  ) {
    const el = textareaRef.current;
    if (!el) {
      return;
    }

    const start = override?.start ?? el.selectionStart ?? el.value.length;
    const end = override?.end ?? el.selectionEnd ?? el.value.length;

    const value = override?.value ?? el.value;
    const atIndex = value.lastIndexOf('@', Math.max(0, start - 1));
    if (atIndex === -1) {
      return;
    }

    const atIsWordStart = atIndex === 0 || /\s/.test(value.charAt(atIndex - 1));
    const segment = value.slice(atIndex + 1, start);
    const hasWhitespaceInSegment = /\s/.test(segment);
    if (!atIsWordStart || hasWhitespaceInSegment) {
      return;
    }

    const left = value.slice(0, atIndex);
    const right = value.slice(end);

    const mention = `@${username}`;

    // Avoid duplicates when immediately followed by the same mention
    const rightAfter = right.startsWith(mention) ? right.slice(mention.length) : right;

    const needsSpaceBefore = left.endsWith(' ') || left.length === 0;
    const needsSpaceAfter = rightAfter.startsWith(' ') || rightAfter.length === 0;

    const withBeforeSpace = needsSpaceBefore ? left : `${left} `;
    const withAfterSpace = needsSpaceAfter ? rightAfter : ` ${rightAfter}`;

    const next = `${withBeforeSpace}${mention}${withAfterSpace}`;
    const caretPos = (withBeforeSpace + mention).length + (needsSpaceBefore ? 0 : 1);

    el.value = next;
    el.setSelectionRange(caretPos, caretPos);
    el.focus();

    setOpen(false);
    // Clear any residual filter so the next mention starts fresh
    setQuery('');
  }

  return (
    <div className={styles.Container}>
      <Autocomplete.Root
        // We handle filtering via `query` state; disable internal filtering
        filter={null}
        items={items}
        open={open}
        onOpenChange={setOpen}
      >
        <div className={styles.TextareaWrapper}>
          <Autocomplete.Textarea
            className={styles.Textarea}
            ref={textareaRef}
            placeholder="Type @ to mention"
            onChange={(event) => {
              const value = event.currentTarget.value;
              const caret = event.currentTarget.selectionStart ?? value.length;
              lastTextStateRef.current = {
                value,
                start: event.currentTarget.selectionStart ?? caret,
                end: event.currentTarget.selectionEnd ?? caret,
              };
              const atIndex = value.lastIndexOf('@', Math.max(0, caret - 1));
              if (atIndex === -1) {
                setOpen(false);
                setQuery('');
                return;
              }
              const atIsWordStart = atIndex === 0 || /\s/.test(value.charAt(atIndex - 1));
              const segment = value.slice(atIndex + 1, caret);
              const hasWhitespaceInSegment = /\s/.test(segment);
              if (!atIsWordStart || hasWhitespaceInSegment) {
                setOpen(false);
                setQuery('');
                return;
              }
              // Open the popup anchored to the textarea and update query
              setOpen(true);
              setQuery(segment);
            }}
            onSelect={(event) => {
              const value = event.currentTarget.value;
              const caret = event.currentTarget.selectionStart ?? value.length;
              lastTextStateRef.current = {
                value,
                start: event.currentTarget.selectionStart ?? caret,
                end: event.currentTarget.selectionEnd ?? caret,
              };
            }}
          />
        </div>

        <Autocomplete.Portal>
          <Autocomplete.Positioner
            className={styles.Positioner}
            // Simpler: anchor to the whole textarea
            anchor={textareaRef}
            sideOffset={10}
            align="start"
          >
            <Autocomplete.Popup className={styles.Popup} aria-label="People">
              <Autocomplete.Empty className={styles.Empty}>No people found.</Autocomplete.Empty>

              <Autocomplete.List className={styles.List}>
                <Autocomplete.Collection>
                  {(user: User) => (
                    <Autocomplete.Item
                      key={user.username}
                      value={user.username}
                      className={styles.Item}
                      onClick={() => {
                        insertMention(user.username, lastTextStateRef.current);
                      }}
                    >
                      <span
                        className={styles.OnlineIndicator}
                        aria-label={user.online ? 'Online' : 'Offline'}
                        data-type={user.online ? 'online' : 'offline'}
                      />
                      <strong>@{user.username}</strong>
                      <span className={styles.FullName}>({user.fullName})</span>
                    </Autocomplete.Item>
                  )}
                </Autocomplete.Collection>
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    </div>
  );
}

interface User {
  username: string;
  fullName: string;
  online: boolean;
}

const USERS: User[] = [
  { username: 'alice', fullName: 'Alice Anderson', online: true },
  { username: 'bob', fullName: 'Bob Brown', online: true },
  { username: 'charlie', fullName: 'Charlie Carter', online: true },
  { username: 'diana', fullName: 'Diana Diaz', online: false },
  { username: 'eve', fullName: 'Eve Edwards', online: true },
  { username: 'frank', fullName: 'Frank Fisher', online: true },
  { username: 'grace', fullName: 'Grace Green', online: true },
  { username: 'heidi', fullName: 'Heidi Hall', online: false },
  { username: 'ivan', fullName: 'Ivan Ivanov', online: true },
  { username: 'judy', fullName: 'Judy Johnson', online: false },
  { username: 'mallory', fullName: 'Mallory Martin', online: true },
  { username: 'oscar', fullName: 'Oscar Owens', online: false },
  { username: 'peggy', fullName: 'Peggy Peterson', online: false },
  { username: 'trent', fullName: 'Trent Taylor', online: false },
  { username: 'victor', fullName: 'Victor Vasquez', online: false },
  { username: 'wendy', fullName: 'Wendy Williams', online: false },
];
