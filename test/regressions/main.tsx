import * as React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router';
import TestViewer from './TestViewer';
import 'docs/src/css/index.css';

interface Fixture {
  Component: React.ComponentType<unknown>;
  name: string;
  path: string;
  suite: string;
}

// Get all the fixtures specifically written for preventing visual regressions.
const globbedRegressionFixtures = import.meta.glob<{ default: React.ComponentType<unknown> }>(
  './fixtures/**/*.tsx',
  { eager: true },
);

const regressionFixtures: Fixture[] = [];

for (const path in globbedRegressionFixtures) {
  const [suite, name] = path
    .replace(/\\/g, '/')
    .replace('./', '')
    .replace(/\.\w+$/, '')
    .split('/');

  regressionFixtures.push({
    path,
    suite: `regression-${suite}`,
    name,
    Component: globbedRegressionFixtures[path].default,
  });
}

const blacklist: (string | RegExp)[] = [];

const unusedBlacklistPatterns = new Set(blacklist);

function excludeDemoFixture(suite: string, name: string, path: string) {
  const blacklisted = blacklist.some((pattern) => {
    if (typeof pattern === 'string') {
      if (pattern === suite) {
        unusedBlacklistPatterns.delete(pattern);

        return true;
      }
      if (pattern === `${suite}/${name}.png`) {
        unusedBlacklistPatterns.delete(pattern);

        return true;
      }

      return false;
    }

    if (pattern.test(suite)) {
      unusedBlacklistPatterns.delete(pattern);
      return true;
    }
    return false;
  });

  if (blacklisted) {
    return true;
  }

  const pathSegments = path.split('/');
  if (pathSegments[1] === 'components' && pathSegments.length === 6) {
    // For demos inside subdirectories under components, include just the entry point - index.js.
    return pathSegments[5] !== 'index.js';
  }

  return false;
}

// Also use all public demos to avoid code duplication.
const globbedDemos = import.meta.glob<{ default: React.ComponentType<unknown> }>(
  // technically it should be 'docs/src/app/\\(public\\)/\\(content\\)/react/**/*.tsx' but tinyglobby doesn't resolve this on Windows
  'docs/src/app/?docs?/react/**/*.tsx',
  { eager: true },
);

const demoFixtures: Fixture[] = [];

for (const path in globbedDemos) {
  const [name, ...suiteArray] = path.split('react')[1].split('/').reverse();
  const suite = `docs-${suiteArray
    .filter((v) => v)
    .reverse()
    .join('-')}`;

  if (!excludeDemoFixture(suite, name, path) && globbedDemos[path].default) {
    demoFixtures.push({
      path,
      suite,
      name,
      Component: globbedDemos[path].default,
    });
  }
}

if (unusedBlacklistPatterns.size > 0) {
  console.warn(
    `The following patterns are unused:\n\n${Array.from(unusedBlacklistPatterns)
      .map((pattern) => `- ${pattern}`)
      .join('\n')}`,
  );
}

const viewerRoot = document.getElementById('test-viewer');

function FixtureRenderer({ component: FixtureComponent }: { component: React.ElementType }) {
  const viewerReactRoot = React.useRef<ReactDOMClient.Root | null>(null);

  React.useLayoutEffect(() => {
    const renderTimeout = setTimeout(() => {
      const children = (
        <TestViewer>
          <FixtureComponent />
        </TestViewer>
      );

      if (viewerReactRoot.current == null && viewerRoot != null) {
        viewerReactRoot.current = ReactDOMClient.createRoot(viewerRoot);
      }

      viewerReactRoot.current?.render(children);
    });

    return () => {
      clearTimeout(renderTimeout);
      setTimeout(() => {
        viewerReactRoot.current?.unmount();
        viewerReactRoot.current = null;
      });
    };
  }, [FixtureComponent]);

  return null;
}

function App(props: { fixtures: Fixture[] }) {
  const { fixtures } = props;

  function computeIsDev() {
    if (window.location.hash === '#dev') {
      return true;
    }
    if (window.location.hash === '#no-dev') {
      return false;
    }
    return process.env.NODE_ENV === 'development';
  }
  const [isDev, setDev] = React.useState(computeIsDev);
  React.useEffect(() => {
    function handleHashChange() {
      setDev(computeIsDev());
    }
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  function computePath(fixture: Fixture) {
    return `/${fixture.suite}/${fixture.name}`;
  }

  return (
    <Router>
      <Routes>
        {fixtures.map((fixture) => {
          const path = computePath(fixture);
          const FixtureComponent = fixture.Component;
          if (FixtureComponent === undefined) {
            console.warn('Missing `Component` for ', fixture);
            return null;
          }

          return (
            <Route
              key={path}
              path={path}
              element={<FixtureRenderer component={FixtureComponent} />}
            />
          );
        })}
      </Routes>

      <div hidden={!isDev}>
        <p>
          Devtools can be enabled by appending <code>#dev</code> in the addressbar or disabled by
          appending <code>#no-dev</code>.
        </p>
        <a href="#no-dev">Hide devtools</a>
        <details>
          <summary id="my-test-summary">nav for all tests</summary>
          <nav id="tests">
            <ol>
              {fixtures.map((fixture) => {
                const path = computePath(fixture);
                return (
                  <li key={path}>
                    <Link to={path}>{path}</Link>
                  </li>
                );
              })}
            </ol>
          </nav>
        </details>
      </div>
    </Router>
  );
}

const container = document.getElementById('react-root');
const children = <App fixtures={regressionFixtures.concat(demoFixtures)} />;

if (container != null) {
  const reactRoot = ReactDOMClient.createRoot(container);
  reactRoot.render(children);
}
