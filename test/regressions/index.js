import * as React from 'react';
import PropTypes from 'prop-types';
import * as ReactDOMClient from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import webfontloader from 'webfontloader';
import TestViewer from './TestViewer';
import 'docs/src/demo-theme.css';
import './tailwind.css';

// Get all the fixtures specifically written for preventing visual regressions.
const importRegressionFixtures = require.context('./fixtures', true, /\.(js|ts|tsx)$/, 'lazy');
const regressionFixtures = [];
importRegressionFixtures
  .keys()
  .filter((path) => path.startsWith('./'))
  .forEach((path) => {
    const [suite, name] = path
      .replace('./', '')
      .replace(/\.\w+$/, '')
      .split('/');
    regressionFixtures.push({
      path,
      suite: `regression-${suite}`,
      name,
      Component: React.lazy(() => importRegressionFixtures(path)),
    });
  }, []);

const blacklist = [];

const unusedBlacklistPatterns = new Set(blacklist);

function excludeDemoFixture(suite, name, path) {
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

    // assume regex
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

// Also use some of the demos to avoid code duplication.
const importDemos = require.context('docs/data', true, /\.js$/, 'lazy');
const demoFixtures = [];

importDemos
  .keys()
  .filter((path) => path.startsWith('./'))
  .forEach((path) => {
    const [name, ...suiteArray] = path.replace('./', '').replace('.js', '').split('/').reverse();
    const suite = `docs-${suiteArray.reverse().join('-')}`;

    if (!excludeDemoFixture(suite, name, path)) {
      demoFixtures.push({
        path,
        suite,
        name,
        Component: React.lazy(() => importDemos(path)),
      });
    }
  }, []);

if (unusedBlacklistPatterns.size > 0) {
  console.warn(
    `The following patterns are unused:\n\n${Array.from(unusedBlacklistPatterns)
      .map((pattern) => `- ${pattern}`)
      .join('\n')}`,
  );
}

const viewerRoot = document.getElementById('test-viewer');

function FixtureRenderer({ component: FixtureComponent }) {
  const viewerReactRoot = React.useRef(null);

  React.useLayoutEffect(() => {
    const renderTimeout = setTimeout(() => {
      const children = (
        <TestViewer>
          <FixtureComponent />
        </TestViewer>
      );

      if (viewerReactRoot.current === null) {
        viewerReactRoot.current = ReactDOMClient.createRoot(viewerRoot);
      }

      viewerReactRoot.current.render(children);
    });

    return () => {
      clearTimeout(renderTimeout);
      setTimeout(() => {
        viewerReactRoot.current.unmount();
        viewerReactRoot.current = null;
      });
    };
  }, [FixtureComponent]);

  return null;
}

FixtureRenderer.propTypes = {
  component: PropTypes.elementType,
};

function App(props) {
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

  // Using <link rel="stylesheet" /> does not apply the google Roboto font in chromium headless/headfull.
  const [fontState, setFontState] = React.useState('pending');
  React.useEffect(() => {
    webfontloader.load({
      google: {
        families: ['Roboto:300,400,500,700', 'Inter:300,400,500,600,700,800,900', 'Material+Icons'],
      },
      custom: {
        families: ['Font Awesome 5 Free:n9'],
        urls: ['https://use.fontawesome.com/releases/v5.1.0/css/all.css'],
      },
      timeout: 20000,
      active: () => {
        setFontState('active');
      },
      inactive: () => {
        setFontState('inactive');
      },
    });
  }, []);

  const fixturePrepared = fontState !== 'pending';

  function computePath(fixture) {
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
              exact
              path={path}
              element={fixturePrepared ? <FixtureRenderer component={FixtureComponent} /> : null}
            />
          );
        })}
      </Routes>

      <div hidden={!isDev}>
        <div data-webfontloader={fontState}>webfontloader: {fontState}</div>
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

App.propTypes = {
  fixtures: PropTypes.array,
};

const container = document.getElementById('react-root');
const children = <App fixtures={regressionFixtures.concat(demoFixtures)} />;
const reactRoot = ReactDOMClient.createRoot(container);
reactRoot.render(children);
