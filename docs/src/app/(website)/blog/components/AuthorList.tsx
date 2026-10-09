import * as React from 'react';
import clsx from 'clsx';
import { Avatar } from '@base-ui/react/avatar';

import './AuthorList.css';

export function Root(props: React.ComponentProps<'ul'>) {
  return <ul {...props} className={clsx('BlogAuthorList', props.className)} />;
}

interface ItemProps extends React.ComponentProps<'li'> {
  name: string;
  image?: string;
  url?: string;
}

export function Item(props: ItemProps) {
  const { name, image, url, className, ...rest } = props;
  const initial = name.trimStart().charAt(0);

  return (
    <li {...rest} className={clsx('BlogAuthorListItem', className)}>
      <Avatar.Root className="BlogAuthorListAvatar" aria-hidden="true">
        <Avatar.Fallback delay={600} className="BlogAuthorListFallback">
          {initial}
        </Avatar.Fallback>
        <Avatar.Image
          keepMounted
          src={image}
          alt=""
          width={24}
          height={24}
          className="BlogAuthorListImage"
        />
      </Avatar.Root>
      {url ? (
        <a className="BlogAuthorListLink" href={url}>
          {name}
        </a>
      ) : (
        <span>{name}</span>
      )}
    </li>
  );
}
