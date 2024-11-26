'use client';
import * as React from 'react';
import * as HamburgerNav from 'docs/src/components/HamburgerNav';
import { nav } from 'docs/src/nav';
import { usePathname } from 'next/navigation';

export function HeaderHamburgerNav() {
  const pathname = usePathname();
  const activeItemRef = React.useRef<HTMLAnchorElement>(null);
  return (
    <HamburgerNav.Root>
      <HamburgerNav.Trigger>Menu</HamburgerNav.Trigger>
      <HamburgerNav.Backdrop />
      <HamburgerNav.Popup initialFocus={activeItemRef}>
        {nav.map((section) => (
          <HamburgerNav.Section key={section.label}>
            <HamburgerNav.Heading>{section.label}</HamburgerNav.Heading>
            <HamburgerNav.List>
              {section.links.map((link) => (
                <HamburgerNav.Item
                  key={link.href}
                  href={link.href}
                  ref={link.href === pathname ? activeItemRef : null}
                >
                  {link.label}
                </HamburgerNav.Item>
              ))}
            </HamburgerNav.List>
          </HamburgerNav.Section>
        ))}
      </HamburgerNav.Popup>
    </HamburgerNav.Root>
  );
}
