import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { HydrationDelay } from './tabs-streaming-ssr-client';
import classes from './tabs-streaming-ssr.module.css';

function DemoTabs() {
  return (
    <Tabs.Root defaultValue={0}>
      <Tabs.List className={classes.list}>
        <Tabs.Tab className={classes.tab} value={0}>
          One
        </Tabs.Tab>
        <Tabs.Tab className={classes.tab} value={1}>
          Two
        </Tabs.Tab>
        <Tabs.Tab className={classes.tab} value={2}>
          Three
        </Tabs.Tab>
        <Tabs.Indicator className={classes.indicator} renderBeforeHydration />
      </Tabs.List>
    </Tabs.Root>
  );
}

// Resolves after the shell has flushed so the boundary streams in late: React parses
// its HTML inside a hidden container (`<div hidden id="S:...">`) and reveals it afterwards.
async function Delayed(props: React.PropsWithChildren) {
  await new Promise((resolve) => {
    setTimeout(resolve, 1500);
  });
  return props.children;
}

// This experiment is a server component so it can exercise streaming SSR.
// It only demonstrates anything when server-rendered (`pnpm docs:dev`); reload the page
// to replay the stream.
export default function TabsStreamingSsrExperiment() {
  return (
    <div className={classes.page}>
      <h1>
        Tabs <code>renderBeforeHydration</code> with streaming SSR
      </h1>
      <p>
        Both tab bars are identical. The second one streams inside a Suspense boundary that resolves
        ~1.5s after the shell, and hydration is artificially held back for 5s after the client
        bundle loads. Before the fix, its indicator stayed <code>[hidden]</code> until hydration
        because the pre-hydration script bailed permanently when it executed inside React&apos;s
        hidden streaming segment; it must now appear as soon as the segment is revealed.
      </p>
      <h2>Outside Suspense (indicator visible before hydration)</h2>
      <DemoTabs />
      <h2>Inside a streamed Suspense boundary</h2>
      <React.Suspense fallback={<p className={classes.fallback}>Streaming…</p>}>
        <Delayed>
          <DemoTabs />
          <HydrationDelay />
        </Delayed>
      </React.Suspense>
    </div>
  );
}
