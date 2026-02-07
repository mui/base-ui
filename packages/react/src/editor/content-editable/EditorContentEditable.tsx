'use client';
import * as React from 'react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import clsx from 'clsx';
import classes from './EditorContentEditable.module.css';

export interface EditorContentEditableProps {
  className?: string | undefined;
}

export function EditorContentEditable(props: EditorContentEditableProps) {
  const { className } = props;

  return <ContentEditable className={clsx(classes.root, className)} />;
}
