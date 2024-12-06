'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import c from './collapsible.module.css';

// https://github.com/mui/base-ui/issues/740
export default function AnimatedCollapsibles() {
  return (
    <div className={c.wrapper}>
      <div className={c.animation}>
        <div className={c.collapsible}>
          <Collapsible.Root defaultOpen={false}>
            <Collapsible.Trigger className={c.trigger}>
              <ExpandMoreIcon />
              Trigger 1A (CSS Animation)
            </Collapsible.Trigger>
            <Collapsible.Panel className={c.panel}>
              <p>This is the collapsed content</p>
              <p>
                You can find the Base UI repository{' '}
                <a
                  href="https://github.com/mui/base-ui"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  here
                </a>
              </p>
            </Collapsible.Panel>
          </Collapsible.Root>
        </div>

        <div className={c.collapsible}>
          <Collapsible.Root>
            <Collapsible.Trigger className={c.trigger}>
              <ExpandMoreIcon />
              Trigger 1B (CSS Animation)
            </Collapsible.Trigger>
            <Collapsible.Panel className={c.panel}>
              <p>This is the collapsed content</p>
              <p>
                You can find the Base UI repository{' '}
                <a
                  href="https://github.com/mui/base-ui"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  here
                </a>
              </p>
            </Collapsible.Panel>
          </Collapsible.Root>
        </div>
      </div>

      <div className={c.transition}>
        <div className={c.collapsible}>
          <Collapsible.Root defaultOpen={false}>
            <Collapsible.Trigger className={c.trigger}>
              <ExpandMoreIcon />
              Trigger 2A (CSS Transition)
            </Collapsible.Trigger>
            <Collapsible.Panel className={c.panel}>
              <p>This is the collapsed content</p>
              <p>
                You can find the Base UI repository{' '}
                <a
                  href="https://github.com/mui/base-ui"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  here
                </a>
              </p>
            </Collapsible.Panel>
          </Collapsible.Root>
        </div>

        <div className={c.collapsible}>
          <Collapsible.Root>
            <Collapsible.Trigger className={c.trigger}>
              <ExpandMoreIcon />
              Trigger 2B (CSS Transition)
            </Collapsible.Trigger>
            <Collapsible.Panel className={c.panel}>
              <p>This is the collapsed content</p>
              <p>
                You can find the Base UI repository{' '}
                <a
                  href="https://github.com/mui/base-ui"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  here
                </a>
              </p>
            </Collapsible.Panel>
          </Collapsible.Root>
        </div>
      </div>
    </div>
  );
}

function ExpandMoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" fill="currentColor" />
    </svg>
  );
}
