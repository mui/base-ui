'use client';

import clsx from 'clsx';
import React, { useEffect } from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { usePathname, useRouter } from 'next/navigation';

import { MenuIcon, EditIcon } from '@/components/icons';

import s from './ItemMenu.module.scss';

interface ItemMenuProps {
  onEdit?: () => void;
  classes?: {
    trigger?: string;
  };
}

export const ItemMenu = ({ onEdit, classes }: ItemMenuProps) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    router.prefetch(`${pathname}/edit`);
  }, [pathname, router]);

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger className={clsx(s.button, classes?.trigger)}>
        <div className={s.buttonIcon}>
          <MenuIcon color="#455468" />
        </div>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={s.positioner} align="end">
          <Menu.Popup className={s.popup}>
            <Menu.Item
              className={s.item}
              onClick={() => {
                if (onEdit) {
                  onEdit();
                } else {
                  router.push(`${pathname}/edit`);
                }
              }}
            >
              <EditIcon color="#64748B" /> Edit
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
