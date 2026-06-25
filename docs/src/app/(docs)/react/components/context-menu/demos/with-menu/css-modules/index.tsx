'use client';
import * as React from 'react';
import { ContextMenu } from '@base-ui/react/context-menu';
import { Menu } from '@base-ui/react/menu';
import styles from './index.module.css';

export default function ContextMenuWithMenuDemo() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={styles.Card}>
        <img
          width="512"
          height="288"
          className={styles.Image}
          src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=512&h=288"
          alt=""
        />
        <div className={styles.Content}>
          <p className={styles.Title}>Station Hofplein</p>
          <p className={styles.Metadata}>JPG, 2.4 MB</p>
        </div>

        <Menu.Root>
          <Menu.Trigger aria-label="Image actions" className={styles.MenuTrigger}>
            <MoreVertIcon />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner align="end" sideOffset={8} className={styles.Positioner}>
              <Menu.Popup className={styles.Popup}>
                <SharedMenuItems />
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Positioner className={styles.Positioner}>
          <ContextMenu.Popup className={styles.Popup}>
            <SharedMenuItems type="context-menu" />
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

const actions = ['Preview', 'Download', 'Copy link', 'Rename'];

function SharedMenuItems({ type = 'menu' }: { type?: 'menu' | 'context-menu' }) {
  const Item = type === 'context-menu' ? ContextMenu.Item : Menu.Item;
  const Separator = type === 'context-menu' ? ContextMenu.Separator : Menu.Separator;
  return (
    <React.Fragment>
      {actions.map((action) => (
        <Item key={action} className={styles.Item}>
          {action}
        </Item>
      ))}
      <Separator className={styles.Separator} />
      <Item className={`${styles.Item} ${styles.ItemDestructive}`}>Delete</Item>
    </React.Fragment>
  );
}

function MoreVertIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M9.5 13c0 .8284-.67157 1.5-1.5 1.5s-1.5-.6716-1.5-1.5.67157-1.5 1.5-1.5 1.5.6716 1.5 1.5m0-5c0 .82843-.67157 1.5-1.5 1.5S6.5 8.82843 6.5 8 7.17157 6.5 8 6.5s1.5.67157 1.5 1.5m0-5c0 .82843-.67157 1.5-1.5 1.5S6.5 3.82843 6.5 3 7.17157 1.5 8 1.5s1.5.67157 1.5 1.5" />
    </svg>
  );
}
