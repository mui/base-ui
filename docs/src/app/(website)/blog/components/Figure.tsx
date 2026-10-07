import * as React from 'react';
import clsx from 'clsx';
import './Figure.css';

export function Root(props: React.ComponentProps<'figure'>) {
  return <figure {...props} className={clsx('FigureBlogRoot', props.className)} />;
}

export function Frame(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('FigureBlogFrame', props.className)} />;
}

export function Caption(props: React.ComponentProps<'figcaption'>) {
  return <figcaption {...props} className={clsx('FigureBlogCaption', props.className)} />;
}
