'use client';

/**
 * Icons: Lucide (ISC License)
 * See LICENSE-lucide in this directory for the full license text.
 */

import * as React from 'react';
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
} from 'lucide-react';
import classes from './EditorToolbar.module.css';
import { useEditorContext } from '../root/Editor';
import { FormatButton } from './components/FormatButton';
import { BlockButton } from './components/BlockButton';
import { ListButton } from './components/ListButton';
import { LinkButton } from './components/LinkButton';
import { HistoryButton } from './components/HistoryButton';

export function EditorToolbar() {
  const { enabledFormats } = useEditorContext();

  const isEnabled = (format: string) => {
    if (!enabledFormats) {
      return true;
    }
    return enabledFormats.includes(format);
  };

  return (
    <div className={classes.root}>
      <div className={classes.buttonGroup} role="group" aria-label="text formatting">
        {isEnabled('bold') && (
          <FormatButton format="bold" className={classes.button} aria-label="bold">
            <Bold size={18} />
          </FormatButton>
        )}
        {isEnabled('italic') && (
          <FormatButton format="italic" className={classes.button} aria-label="italic">
            <Italic size={18} />
          </FormatButton>
        )}
        {isEnabled('underline') && (
          <FormatButton format="underline" className={classes.button} aria-label="underline">
            <Underline size={18} />
          </FormatButton>
        )}
        {isEnabled('strikethrough') && (
          <FormatButton format="strikethrough" className={classes.button} aria-label="strikethrough">
            <Strikethrough size={18} />
          </FormatButton>
        )}
        {isEnabled('code') && (
          <FormatButton format="code" className={classes.button} aria-label="inline code">
            <Code size={18} />
          </FormatButton>
        )}
      </div>

      {(isEnabled('h1') ||
        isEnabled('h2') ||
        isEnabled('quote') ||
        isEnabled('paragraph') ||
        isEnabled('code')) && (
        <React.Fragment>
          <div className={classes.divider} aria-hidden="true" />
          <div className={classes.buttonGroup} role="group" aria-label="block formatting">
            {isEnabled('h1') && (
              <BlockButton type="h1" className={classes.button} aria-label="heading 1">
                <Heading1 size={18} />
              </BlockButton>
            )}
            {isEnabled('h2') && (
              <BlockButton type="h2" className={classes.button} aria-label="heading 2">
                <Heading2 size={18} />
              </BlockButton>
            )}
            {isEnabled('quote') && (
              <BlockButton type="quote" className={classes.button} aria-label="blockquote">
                <Quote size={18} />
              </BlockButton>
            )}
            {isEnabled('paragraph') && (
              <BlockButton type="paragraph" className={classes.button} aria-label="paragraph">
                <Type size={18} />
              </BlockButton>
            )}
            {isEnabled('code') && (
              <BlockButton type="code" className={classes.button} aria-label="code block">
                <SquareCode size={18} />
              </BlockButton>
            )}
          </div>
        </React.Fragment>
      )}

      {(isEnabled('bullet') || isEnabled('number')) && (
        <React.Fragment>
          <div className={classes.divider} aria-hidden="true" />
          <div className={classes.buttonGroup} role="group" aria-label="lists">
            {isEnabled('bullet') && (
              <ListButton type="bullet" className={classes.button} aria-label="bullet list">
                <List size={18} />
              </ListButton>
            )}
            {isEnabled('number') && (
              <ListButton type="number" className={classes.button} aria-label="numbered list">
                <ListOrdered size={18} />
              </ListButton>
            )}
          </div>
        </React.Fragment>
      )}

      {isEnabled('link') && (
        <React.Fragment>
          <div className={classes.divider} aria-hidden="true" />
          <div className={classes.buttonGroup} role="group" aria-label="links">
            <LinkButton
              className={classes.button}
              popoverClassName={classes.popoverPopup}
              formClassName={classes.linkForm}
              inputClassName={classes.linkInput}
              applyButtonClassName={classes.linkButton}
              aria-label="link"
            >
              <LinkIcon size={18} />
            </LinkButton>
          </div>
        </React.Fragment>
      )}

      {(isEnabled('undo') || isEnabled('redo')) && (
        <React.Fragment>
          <div className={classes.divider} aria-hidden="true" />
          <div className={classes.buttonGroup} role="group" aria-label="history">
            {isEnabled('undo') && (
              <HistoryButton type="undo" className={classes.button} aria-label="undo">
                <Undo2 size={18} />
              </HistoryButton>
            )}
            {isEnabled('redo') && (
              <HistoryButton type="redo" className={classes.button} aria-label="redo">
                <Redo2 size={18} />
              </HistoryButton>
            )}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
