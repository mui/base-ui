import * as React from 'react';

export function Favicons() {
  return (
    <React.Fragment>
      {/* Separate set of favicons in dev so that the dev tabs are easier to spot */}
      {process.env.NODE_ENV !== 'production' && (
        <React.Fragment>
          <link rel="icon" href="/static/favicon-dev.ico" sizes="32x32" />
          <link rel="icon" href="/static/favicon-dev.svg" type="image/svg+xml" />
        </React.Fragment>
      )}
      {process.env.NODE_ENV === 'production' && (
        <React.Fragment>
          <link rel="icon" href="/static/favicon.ico" sizes="32x32" />
          <link rel="icon" href="/static/favicon.svg" type="image/svg+xml" />
        </React.Fragment>
      )}
      {/* Used by Safari when the website is favourited */}
      <link rel="apple-touch-icon" href="/static/apple-touch-icon.png" />
    </React.Fragment>
  );
}
