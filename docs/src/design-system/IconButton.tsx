import * as React from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { type UrlObject } from 'url';
import classes from './IconButton.module.css';
import { Tooltip } from './Tooltip';

export function IconButton(props: IconButton.Props) {
  const { size = 1, label, withTooltip } = props;
  const button = (
    <button
      type="button"
      aria-label={label}
      {...props}
      className={clsx(classes.root, classes[`size-${size}`], props.className)}
    />
  );

  if (withTooltip) {
    return <Tooltip label={label}>{button}</Tooltip>;
  }

  return button;
}

export function IconLinkButton(props: IconLinkButton.Props) {
  const { size = 1, useNextLink, label, withTooltip } = props;
  const link = useNextLink ? (
    <Link
      aria-label={label}
      {...props}
      className={clsx(classes.root, classes[`size-${size}`], props.className)}
    />
  ) : (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a
      aria-label={label}
      {...props}
      className={clsx(classes.root, classes[`size-${size}`], props.className)}
    />
  );

  if (withTooltip) {
    return <Tooltip label={label}>{link}</Tooltip>;
  }

  return link;
}

export namespace IconButton {
  export interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    size?: 1 | 2 | 3;
    label: string;
    withTooltip?: boolean;
  }
}

export namespace IconLinkButton {
  export type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    size?: 1 | 2 | 3;
    label: string;
    withTooltip?: boolean;
  } & (
      | {
          useNextLink?: false;
          href?: string;
        }
      | {
          useNextLink: true;
          href: string | UrlObject;
        }
    );
}
