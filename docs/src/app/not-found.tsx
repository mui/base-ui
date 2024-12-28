import * as React from 'react';
import { Link } from 'docs/src/components/Link';
import { ArrowRightIcon } from 'docs/src/icons/ArrowRightIcon';
import { Logo } from 'docs/src/components/Logo';
import RootLayout from './(public)/layout';
import './not-found.css';

export default function NotFound() {
  return (
    <RootLayout>
      <div className="NotFoundRoot">
        <div className="NotFoundContent">
          <Logo className="mb-8 ml-px" aria-label="Base UI" />
          <h1 className="NotFoundHeading">404</h1>
          <p className="NotFoundCaption">
            This page couldn’t be found. Please return to the docs or create a
            corresponding issue on GitHub.
          </p>
          <div className="flex flex-col items-start gap-2">
            <Link
              className="-m-1 inline-flex items-center gap-1 p-1"
              href="/react/overview/quick-start"
            >
              Documentation <ArrowRightIcon />
            </Link>

            <Link className="-m-1 p-1" href="https://github.com/mui/base-ui">
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
