import * as React from 'react';
import { useFakeTimers } from 'sinon';

function TestViewer(props: { children: React.ReactNode }) {
  const { children } = props;

  // We're simulating `act(() => ReactDOM.render(children))`
  // In the end children passive effects should've been flushed.
  // React doesn't have any such guarantee outside of `act()` so we're approximating it.
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    function handleFontsEvent(event: Event) {
      if (event.type === 'loading') {
        setReady(false);
      } else if (event.type === 'loadingdone') {
        // Don't know if there could be multiple loaded events after we started loading multiple times.
        // So make sure we're only ready if fonts are actually ready.
        if (document.fonts.status === 'loaded') {
          setReady(true);
        }
      }
    }

    document.fonts.addEventListener('loading', handleFontsEvent);
    document.fonts.addEventListener('loadingdone', handleFontsEvent);

    // Use a "real timestamp" so that we see a useful date instead of "00:00"
    // eslint-disable-next-line react-hooks/rules-of-hooks -- not a React hook
    const clock = useFakeTimers({
      now: new Date('Mon Aug 18 14:11:54 2014 -0500'),
      toFake: ['Date'],
    });
    // In case the child triggered font fetching we're not ready yet.
    // The fonts event handler will mark the test as ready on `loadingdone`
    if (document.fonts.status === 'loaded') {
      setReady(true);
    }

    return () => {
      document.fonts.removeEventListener('loading', handleFontsEvent);
      document.fonts.removeEventListener('loadingdone', handleFontsEvent);
      clock.restore();
    };
  }, []);

  const globalStyles = `
    html {
      --webkit-font-smoothing: antialiased;
      --moz-osx-font-smoothing: grayscale;
      /* Do the opposite of the docs in order to help catching issues. */
      box-sizing: content-box;
    }

    *, *::before, *::after {
      box-sizing: inherit;
      /* Disable transitions to avoid flaky screenshots */
      transition: none !important;
      animation: none !important;
    }

    body {
      margin: 0;
      overflow-x: hidden;
    }
  `;

  return (
    <React.Fragment>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <React.Suspense fallback={<div aria-busy />}>
        <div aria-busy={!ready} data-testid="testcase" style={{ display: 'block', padding: '8px' }}>
          {children}
        </div>
      </React.Suspense>
    </React.Fragment>
  );
}

export default TestViewer;
