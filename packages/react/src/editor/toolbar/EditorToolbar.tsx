'use client';

/**
 * Icons: Lucide (ISC License)
 * See LICENSE-lucide in this directory for the full license text.
 */

import * as React from 'react';
import clsx from 'clsx';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Quote,
  Type,
  Code,
  SquareCode,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Superscript,
  Subscript,
  Image,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@base-ui/react/button';
import { Menu } from '@base-ui/react/menu';
import { useEditor, useSelection } from '@base-ui/react/editor';
import classes from './EditorToolbar.module.css';
import { useEditorContext } from '../root/Editor';
import { FormatButton } from './components/FormatButton';
import { LinkButton } from './components/LinkButton';
import { HistoryButton } from './components/HistoryButton';
import { BlockButton } from './components/BlockButton';
import { ToolbarSelect } from './components/ToolbarSelect';
import { InsertImageButton } from './components/InsertImageButton';
import { HighlightColorButton } from './components/HighlightColorButton';

export function EditorToolbar() {
  const { enabledFormats, compact } = useEditorContext();
  const { commands } = useEditor();
  const selection = useSelection();

  const isEnabled = React.useCallback((format: string) => {
    if (!enabledFormats) {
      return true;
    }
    return enabledFormats.includes(format);
  }, [enabledFormats]);

  const headingItems = React.useMemo(() => {
    const items = [];
    if (isEnabled('h1')) {items.push({ value: 'h1', label: 'Heading 1', icon: <Heading1 size={18} /> });}
    if (isEnabled('h2')) {items.push({ value: 'h2', label: 'Heading 2', icon: <Heading2 size={18} /> });}
    return items;
  }, [isEnabled]);

  const listItems = React.useMemo(() => {
    const items = [];
    if (isEnabled('bullet')) {items.push({ value: 'bullet', label: 'Bullet List', icon: <List size={18} /> });}
    if (isEnabled('number')) {items.push({ value: 'number', label: 'Numbered List', icon: <ListOrdered size={18} /> });}
    return items;
  }, [isEnabled]);

  const alignmentItems = React.useMemo(() => {
    const items = [];
    if (isEnabled('left')) {items.push({ value: 'left', label: 'Left', icon: <AlignLeft size={18} /> });}
    if (isEnabled('center')) {items.push({ value: 'center', label: 'Center', icon: <AlignCenter size={18} /> });}
    if (isEnabled('right')) {items.push({ value: 'right', label: 'Right', icon: <AlignRight size={18} /> });}
    if (isEnabled('justify')) {items.push({ value: 'justify', label: 'Justify', icon: <AlignJustify size={18} /> });}
    return items;
  }, [isEnabled]);

  const iconSize = compact ? 16 : 18;

  // Build groups of controls. We will measure their width and move overflowing groups into a menu.
  const groups = React.useMemo(() => {
    const items: Array<{ key: string; element: React.ReactNode }> = [];

    // 1. Inline text formatting
    items.push({
      key: 'text',
      element: (
        <div className={clsx(classes.buttonGroup, compact && classes.buttonGroupCompact)} role="group" aria-label="text formatting">
          {isEnabled('bold') && (
            <FormatButton format="bold" className={clsx(classes.button, compact && classes.buttonCompact)} aria-label="bold">
              <Bold size={iconSize} />
            </FormatButton>
          )}
          {isEnabled('italic') && (
            <FormatButton format="italic" className={clsx(classes.button, compact && classes.buttonCompact)} aria-label="italic">
              <Italic size={iconSize} />
            </FormatButton>
          )}
          {isEnabled('underline') && (
            <FormatButton format="underline" className={clsx(classes.button, compact && classes.buttonCompact)} aria-label="underline">
              <Underline size={iconSize} />
            </FormatButton>
          )}
          {isEnabled('strikethrough') && (
            <FormatButton format="strikethrough" className={clsx(classes.button, compact && classes.buttonCompact)} aria-label="strikethrough">
              <Strikethrough size={iconSize} />
            </FormatButton>
          )}
          {isEnabled('code') && (
            <FormatButton format="code" className={clsx(classes.button, compact && classes.buttonCompact)} aria-label="inline code">
              <Code size={iconSize} />
            </FormatButton>
          )}
          {isEnabled('subscript') && (
            <FormatButton format="subscript" className={clsx(classes.button, compact && classes.buttonCompact)} aria-label="subscript">
              <Subscript size={iconSize} />
            </FormatButton>
          )}
          {isEnabled('superscript') && (
            <FormatButton format="superscript" className={clsx(classes.button, compact && classes.buttonCompact)} aria-label="superscript">
              <Superscript size={iconSize} />
            </FormatButton>
          )}
          {isEnabled('highlight') && (
            <HighlightColorButton className={clsx(classes.button, compact && classes.buttonCompact)} popoverClassName={classes.popoverPopup} />
          )}
        </div>
      ),
    });

    // 2. Block buttons (paragraph, quote, code)
    if (isEnabled('paragraph') || isEnabled('quote') || isEnabled('code')) {
      items.push({
        key: 'blocks',
        element: (
          <div className={clsx(classes.buttonGroup, compact && classes.buttonGroupCompact)} role="group" aria-label="block formatting">
            {isEnabled('paragraph') && (
              <BlockButton type="paragraph" className={clsx(classes.button, compact && classes.buttonCompact)} aria-label="normal text">
                <Type size={iconSize} />
              </BlockButton>
            )}
            {isEnabled('quote') && (
              <BlockButton type="quote" className={clsx(classes.button, compact && classes.buttonCompact)} aria-label="quote">
                <Quote size={iconSize} />
              </BlockButton>
            )}
            {isEnabled('code') && (
              <BlockButton type="code" className={clsx(classes.button, compact && classes.buttonCompact)} aria-label="code block">
                <SquareCode size={iconSize} />
              </BlockButton>
            )}
          </div>
        ),
      });
    }

    // 3. Headings select
    if (isEnabled('h1') || isEnabled('h2')) {
      items.push({
        key: 'heading',
        element: (
          <ToolbarSelect
            value={selection.blockType.startsWith('h') ? selection.blockType : ''}
            onValueChange={(val) => {
              if (val) {
                commands.toggleBlock(val as any);
              } else {
                commands.toggleBlock('paragraph');
              }
            }}
            items={headingItems}
            aria-label="heading"
            className={clsx(classes.button, compact && classes.buttonCompact)}
          />
        ),
      });
    }

    // 4. Lists select
    if (isEnabled('bullet') || isEnabled('number')) {
      const currentListValue = (selection.blockType === 'bullet' || selection.blockType === 'number') ? selection.blockType : 'none';
      items.push({
        key: 'lists',
        element: (
          <ToolbarSelect
            value={currentListValue}
            onValueChange={(val) => {
              if (val === 'bullet') {
                commands.toggleList('ul');
              } else if (val === 'number') {
                commands.toggleList('ol');
              } else {
                commands.removeList();
              }
            }}
            items={listItems}
            aria-label="list type"
            className={clsx(classes.button, compact && classes.buttonCompact)}
          />
        ),
      });
    }

    // 5. Alignment select
    if (isEnabled('left') || isEnabled('center') || isEnabled('right') || isEnabled('justify')) {
      items.push({
        key: 'align',
        element: (
          <ToolbarSelect
            value={selection.elementFormat}
            onValueChange={(val) => {
              if (val) {
                commands.formatElement(val as any);
              } else {
                commands.formatElement('left');
              }
            }}
            items={alignmentItems}
            aria-label="alignment"
            className={clsx(classes.button, compact && classes.buttonCompact)}
          />
        ),
      });
    }

    // 6. Insert (link, image)
    if (isEnabled('link') || isEnabled('image')) {
      items.push({
        key: 'insert',
        element: (
          <div className={clsx(classes.buttonGroup, compact && classes.buttonGroupCompact)} role="group" aria-label="insert">
            {isEnabled('link') && (
              <LinkButton
                className={clsx(classes.button, compact && classes.buttonCompact)}
                popoverClassName={classes.popoverPopup}
                formClassName={classes.linkForm}
                inputClassName={classes.linkInput}
                applyButtonClassName={classes.linkButton}
                aria-label="link"
              >
                <LinkIcon size={iconSize} />
              </LinkButton>
            )}
            {isEnabled('image') && (
              <InsertImageButton
                className={clsx(classes.button, compact && classes.buttonCompact)}
                popoverClassName={classes.popoverPopup}
                formClassName={classes.linkForm}
                inputClassName={classes.linkInput}
                applyButtonClassName={classes.linkButton}
                aria-label="image"
              >
                <Image size={iconSize} />
              </InsertImageButton>
            )}
          </div>
        ),
      });
    }

    // 7. History (undo/redo)
    if (isEnabled('undo') || isEnabled('redo')) {
      items.push({
        key: 'history',
        element: (
          <div className={clsx(classes.buttonGroup, compact && classes.buttonGroupCompact)} role="group" aria-label="history">
            {isEnabled('undo') && (
              <HistoryButton type="undo" className={clsx(classes.button, compact && classes.buttonCompact)} aria-label="undo">
                <Undo2 size={iconSize} />
              </HistoryButton>
            )}
            {isEnabled('redo') && (
              <HistoryButton type="redo" className={clsx(classes.button, compact && classes.buttonCompact)} aria-label="redo">
                <Redo2 size={iconSize} />
              </HistoryButton>
            )}
          </div>
        ),
      });
    }

    return items;
  }, [compact, isEnabled, iconSize, selection.blockType, selection.elementFormat, headingItems, commands, listItems, alignmentItems]);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const moreRef = React.useRef<HTMLButtonElement | null>(null);
  const [visibleCount, setVisibleCount] = React.useState<number>(groups.length);

  // Recompute on resize or groups change
  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return () => {};
    }

    const ro = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }

      const available = entry.contentRect.width;
      const itemElms = itemRefs.current;
      const moreElm = moreRef.current;
      let moreWidth: number;
      if (moreElm) {
        moreWidth = moreElm.offsetWidth;
      } else {
        moreWidth = compact ? 28 : 36;
      }

      let used = 0;
      let nextVisible = 0;

      for (let i = 0; i < itemElms.length; i += 1) {
        const el = itemElms[i];
        if (!el) {
          continue;
        }

        const isLast = i === groups.length - 1;
        const w = el.offsetWidth;
        const totalW = used + w + (isLast ? 0 : moreWidth);

        if (totalW <= available) {
          used += w;
          nextVisible = i + 1;
        } else {
          break;
        }
      }

      // If everything fits, we don't need the 'more' button,
      // so we re-check if we can fit the last item without moreWidth.
      if (nextVisible === groups.length - 1) {
        const lastEl = itemElms[groups.length - 1];
        if (lastEl && used + lastEl.offsetWidth <= available) {
          nextVisible = groups.length;
        }
      }

      setVisibleCount(nextVisible);
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [groups.length, compact]);

  return (
    <div ref={containerRef} className={clsx(classes.root, compact && classes.rootCompact)}>
      {/* Hidden measuring row */}
      <div
        style={{
          position: 'absolute',
          visibility: 'hidden',
          pointerEvents: 'none',
          height: 0,
          overflow: 'hidden',
        }}
      >
        {groups.map((g, i) => (
          <div
            key={`measure-${g.key}`}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            style={{ display: 'inline-block' }}
          >
            {g.element}
          </div>
        ))}
        {/* More button for measurement */}
        <Button
          ref={moreRef}
          className={clsx(classes.button, compact && classes.buttonCompact)}
          aria-label="more options"
        >
          <MoreHorizontal size={iconSize} />
        </Button>
      </div>

      {/* Visible groups */}
      {groups.slice(0, visibleCount).map((g) => (
        <React.Fragment key={g.key}>{g.element}</React.Fragment>
      ))}

      {/* Overflow menu */}
      {visibleCount < groups.length && (
        <Menu.Root>
          <Menu.Trigger
            render={
              <Button
                ref={moreRef}
                className={clsx(classes.button, compact && classes.buttonCompact)}
                aria-label="more options"
              >
                <MoreHorizontal size={iconSize} />
              </Button>
            }
          />
          <Menu.Portal>
            <Menu.Positioner sideOffset={4}>
              <Menu.Popup>
                <div style={{ display: 'grid', gap: compact ? '0.25rem' : '0.5rem' }}>
                  {groups.slice(visibleCount).map((g) => (
                    <div key={`overflow-${g.key}`}>{g.element}</div>
                  ))}
                </div>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      )}
    </div>
  );
}
