'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import c from './collapsible.module.css';

export default function CollapsibleHiddenUntilFound() {
  return (
    <React.Fragment>
      <pre className={c.pre}>
        All 3 Collapsibles contain the text &quot;May the force be with you&quot; but
        only the content in the 2nd and 3rd Collapsible will be revealed by the
        browser&apos;s in-page search (e.g. Ctrl/Cmd-F) in{' '}
        <a href="https://caniuse.com/mdn-html_global_attributes_hidden_until-found_value">
          supported browsers
        </a>
        <br />
        <br />
        All Collapsibles here are animated, but if they are opened by find-in-page,
        the opening animation will be disabled (one-off) and open instantly
        <br />
        <br />
        Collapsible #2 is animated using CSS @keyframe animation, while #1 and #3 is
        animated with CSS transitions. #3 demonstrates a possible browser bug where
        the matching text is not properly highlighted by the browser the first time
        that instance is matched. It only occurs with transitions, not @keyframe
        animations.
      </pre>
      <div className={c.wrapper}>
        <div className={c.transition}>
          <div className={c.collapsible}>
            <Collapsible.Root defaultOpen={false}>
              <Collapsible.Trigger className={c.trigger}>
                <ExpandMoreIcon />
                Trigger 1
              </Collapsible.Trigger>
              <Collapsible.Panel className={c.panel}>
                <p>This is the collapsed content</p>
                <p>May the force be with you</p>
              </Collapsible.Panel>
            </Collapsible.Root>
          </div>
        </div>

        <div className={c.animation}>
          <div className={c.collapsible}>
            <Collapsible.Root defaultOpen={false}>
              <Collapsible.Trigger className={c.trigger}>
                <ExpandMoreIcon />
                Trigger 2
              </Collapsible.Trigger>
              <Collapsible.Panel className={c.panel} hiddenUntilFound>
                <p>This is the collapsed content</p>
                <p>May the force be with you</p>
              </Collapsible.Panel>
            </Collapsible.Root>
          </div>
        </div>

        <div className={c.transition}>
          <div className={c.collapsible}>
            <Collapsible.Root defaultOpen={false}>
              <Collapsible.Trigger className={c.trigger}>
                <ExpandMoreIcon />
                Trigger 3
              </Collapsible.Trigger>
              <Collapsible.Panel className={c.panel} hiddenUntilFound>
                <p>This is the collapsed content</p>
                <p>May the force be with you</p>
              </Collapsible.Panel>
            </Collapsible.Root>
          </div>
        </div>
      </div>
    </React.Fragment>
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
