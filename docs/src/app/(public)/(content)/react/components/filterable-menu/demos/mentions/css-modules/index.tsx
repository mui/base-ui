'use client';
import * as React from 'react';
import { FilterableMenu } from '@base-ui-components/react/filterable-menu';
import styles from './index.module.css';

export default function ExampleMentionsFilterableMenu() {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [caretRect, setCaretRect] = React.useState<DOMRect | null>(null);

  const filter = FilterableMenu.useFilter({ sensitivity: 'base' });

  const items = React.useMemo(() => {
    if (query === '') {
      return USERS;
    }
    return USERS.filter((user) => filter.startsWith(user.username, query));
  }, [query, filter]);

  function insertMention(username: string) {
    const el = textareaRef.current;
    if (!el) {
      return;
    }

    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;

    const value = el.value;
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
    const needsSpaceBefore = left.endsWith(' ') || left.length === 0;
    const needsSpaceAfter = right.startsWith(' ') || right.length === 0;

    const withBeforeSpace = needsSpaceBefore ? left : `${left} `;
    const withAfterSpace = needsSpaceAfter ? right : ` ${right}`;

    const next = `${withBeforeSpace}${mention}${withAfterSpace}`;
    const caretPos = (withBeforeSpace + mention).length + (needsSpaceBefore ? 0 : 1);

    el.value = next;
    el.setSelectionRange(caretPos, caretPos);
    el.focus();

    setOpen(false);
    setQuery('');
    setCaretRect(null);
  }

  function computeCaretRect(textarea: HTMLTextAreaElement, index: number): DOMRect | null {
    const selectionEnd = Math.max(0, Math.min(index, textarea.value.length));
    const value = textarea.value;
    const textareaRect = textarea.getBoundingClientRect();

    // Mirror element
    const div = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    div.style.position = 'fixed';
    div.style.left = `${textareaRect.left}px`;
    div.style.top = `${textareaRect.top}px`;
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.overflow = 'hidden';
    div.style.boxSizing = 'border-box';
    div.style.width = `${textarea.clientWidth}px`;
    div.style.height = 'auto';
    div.style.padding = style.padding;
    div.style.border = style.border;
    div.style.font = style.font;
    div.style.letterSpacing = style.letterSpacing;
    div.style.lineHeight = style.lineHeight;
    div.style.tabSize = style.tabSize as string;

    const textBefore = value.slice(0, selectionEnd);
    const textNode = document.createTextNode(textBefore);
    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    div.appendChild(textNode);
    div.appendChild(marker);
    document.body.appendChild(div);

    div.scrollTop = textarea.scrollTop;
    div.scrollLeft = textarea.scrollLeft;

    const markerRect = marker.getBoundingClientRect();
    document.body.removeChild(div);

    if (!markerRect) {
      return null;
    }

    const lineHeight = parseFloat(style.lineHeight || '16') || 16;
    return new DOMRect(markerRect.left, markerRect.top, 0, lineHeight);
  }

  return (
    <div className={styles.Container}>
      <FilterableMenu.Root
        items={items}
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery('');
          }
        }}
        onSelectedValueChange={(value: any) => {
          if (typeof value === 'string') {
            insertMention(value);
          }
        }}
      >
        <div className={styles.TextareaWrapper}>
          <FilterableMenu.Textarea
            className={styles.Textarea}
            ref={textareaRef}
            placeholder="Type @ to mention"
            onChange={(event) => {
              const value = event.currentTarget.value;
              const caret = event.currentTarget.selectionStart ?? value.length;
              const atIndex = value.lastIndexOf('@', Math.max(0, caret - 1));
              if (atIndex === -1) {
                setOpen(false);
                setQuery('');
                setCaretRect(null);
                return;
              }
              const atIsWordStart = atIndex === 0 || /\s/.test(value.charAt(atIndex - 1));
              const segment = value.slice(atIndex + 1, caret);
              const hasWhitespaceInSegment = /\s/.test(segment);
              if (!atIsWordStart || hasWhitespaceInSegment) {
                setOpen(false);
                setQuery('');
                setCaretRect(null);
                return;
              }
              setOpen(true);
              setQuery(segment);
              const el = textareaRef.current;
              if (el && !open) {
                const rect = computeCaretRect(el, atIndex + 1);
                setCaretRect(rect);
              }
            }}
          />
        </div>

        <FilterableMenu.Portal>
          <FilterableMenu.Positioner
            className={styles.Positioner}
            anchor={caretRect ? { getBoundingClientRect: () => caretRect } : textareaRef}
            sideOffset={10}
            align="start"
          >
            <FilterableMenu.Popup className={styles.Popup} aria-label="People">
              <FilterableMenu.Empty className={styles.Empty}>No people found.</FilterableMenu.Empty>

              <FilterableMenu.List className={styles.List}>
                <FilterableMenu.Collection>
                  {(user: User) => (
                    <FilterableMenu.Item
                      key={user.username}
                      value={user.username}
                      className={styles.Item}
                    >
                      <span
                        className={styles.OnlineIndicator}
                        aria-label={user.online ? 'Online' : 'Offline'}
                        data-type={user.online ? 'online' : 'offline'}
                      />
                      <strong>@{user.username}</strong>
                      <span className={styles.FullName}>({user.fullName})</span>
                    </FilterableMenu.Item>
                  )}
                </FilterableMenu.Collection>
              </FilterableMenu.List>
            </FilterableMenu.Popup>
          </FilterableMenu.Positioner>
        </FilterableMenu.Portal>
      </FilterableMenu.Root>
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
