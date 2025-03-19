import * as React from 'react';
import type { GenericHTMLProps } from './types';

export function button(props: React.ComponentPropsWithRef<'button'>) {
  return <button type="button" {...props} />;
}

export function img(props: React.ComponentPropsWithRef<'img'>) {
  return <img alt="" {...props} />;
}

export function tag(Tag: string) {
  return (props: GenericHTMLProps) => <Tag {...props} />;
}
