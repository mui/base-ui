import * as React from 'react';

export function Favicons() {
  return (
    <React.Fragment>
      {/* Separate set of favicons in dev so that the dev tabs are easier to spot */}
      {process.env.NODE_ENV !== 'production' && (
        <React.Fragment>
          <link rel="icon" href="/static/favicon-dev.ico" sizes="32x32" />
        </React.Fragment>
      )}

      {process.env.NODE_ENV === 'production' && (
        <React.Fragment>
          {/* Safari gets a different favicon because it messes up the original one in dark mode */}
          <link rel="icon" href="/static/favicon-safari.ico" sizes="32x32" />
          <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />
        </React.Fragment>
      )}

      <link rel="apple-touch-icon" href="/static/apple-touch-icon.png" />
    </React.Fragment>
  );
}
