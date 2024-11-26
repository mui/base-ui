'use client';
import * as React from 'react';
import * as HamburgerNav from 'docs/src/components/HamburgerNav';
import { nav } from 'docs/src/nav';

export function HeaderHamburgerNav() {
  return (
    <HamburgerNav.Root>
      <HamburgerNav.Trigger>Menu</HamburgerNav.Trigger>
      <HamburgerNav.Backdrop />
      <HamburgerNav.Popup
      // initialFocus={activeItemRef}
      >
        {nav.map((section) => (
          <HamburgerNav.Section key={section.label}>
            <HamburgerNav.Heading>{section.label}</HamburgerNav.Heading>
            <HamburgerNav.List>
              {section.links.map((link) => (
                <HamburgerNav.Item key={link.href} href={link.href}>
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
