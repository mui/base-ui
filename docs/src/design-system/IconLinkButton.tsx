import * as React from 'react';
import { type UrlObject } from 'url';
import clsx from 'clsx';
import Link from 'next/link';
import { Tooltip } from './Tooltip';
import classes from './IconButton.module.css';

export function IconLinkButton(props: IconLinkButton.Props) {
  const { size = 1, useNextLink, label, withTooltip, ...other } = props;
  const link = useNextLink ? (
    <Link
      aria-label={label}
      {...(other as React.ComponentPropsWithoutRef<typeof Link>)}
      className={clsx(classes.root, classes[`s-${size}`], props.className)}
    />
  ) : (
    <a
      aria-label={label}
      {...(other as React.ComponentPropsWithoutRef<'a'>)}
      className={clsx(classes.root, classes[`s-${size}`], props.className)}
    />
  );

  if (withTooltip) {
    return <Tooltip label={label}>{link}</Tooltip>;
  }

  return link;
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
