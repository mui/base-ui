import * as React from 'react';
import type { Metadata, Viewport } from 'next';
import { Link } from 'docs/src/components/Link';
import { ArrowRightIcon } from 'docs/src/icons/ArrowRightIcon';
import { Logo } from 'docs/src/components/Logo';

export default function Homepage() {
  return (
    <React.Fragment>
      {/* Set the Site name for Google results. https://developers.google.com/search/docs/appearance/site-names */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Base UI',
            url: 'https://base-ui.com',
          }),
        }}
      />

      <div className="bs-bb d-g gtc-8 g-8 bp2:g-9">
        <header className="d-c">
          <div className="gcs-1 gce-4">
            <Logo aria-label="Base UI" />
          </div>
          <nav
            className="d-f fd-c g-2 gcs-5 gce-8 bp2:gcs-5 bp2:gce-9 bp3:gcs-5 bp3:gce-7"
            aria-label="social links"
          >
            <a className="Text size-1 Link" href="https://x.com/base_ui">
              X
            </a>
            <a className="Text size-1 Link" href="https://github.com/mui/base-ui">
              Github
            </a>
            <a className="Text size-1 Link" href="https://discord.com/invite/g6C3hUtuxz">
              Discord
            </a>
          </nav>
          <div className="d-n bp3:d-b gcs-7 gce-9">
            <a className="Text size-1 Link" href="#">
              Components
            </a>
          </div>
        </header>
        <main id="main" className="d-c">
          <section className="d-c">
            <h1 className="Text size-3 bp2:size-4 gcs-1 gce-9 bp4:gce-5">
              Unstyled UI components for building accessible user interfaces
            </h1>
            <div className="gcs-1 gce-9">
              <Link className="Text size-2 Link d-if" href="/react/overview/quick-start">
                Documentation
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="Icon"
                >
                  <path className="LinkArrowCaret" d="M6 12L10 8L6 4"></path>
                  <path className="LinkArrowLine" d="M2 8L13 8"></path>
                </svg>
              </Link>
            </div>
          </section>
          <section className="d-c">
            <div className="d-f fd-c g-4 gcs-1 gce-9 bp2:gcs-3 bp4:gce-7">
              <p className="Text size-2">
                From the creators of Radix, Floating&nbsp;UI, and Material&nbsp;UI, Base&nbsp;UI is
                a comprehensive UI component library for building accessible user interfaces with
                React.
              </p>
              <p className="Text size-2">
                Each Base UI component is meticulously designed for composability, consistency, and
                craft. The library's architecture prioritizes flexibility—without imposing visual
                opinions—helping teams craft distinctive interfaces that are fundamentally
                accessible and reliable.
              </p>
              <p className="Text size-2">
                Collectively, we've been building component libraries for multiple decades. We've
                learned what works, what lasts, and what doesn't. And we really, really sweat the
                details.
              </p>
              <p className="Text size-2">
                Base UI is built to last. It is designed with care and maintained with intent. Our
                mission is to provide a future-proof foundation for professional interface design on
                the Web.
              </p>
            </div>
          </section>
          <div className="gcs-1 gce-9 bp3:gcs-3">
            <div className="Separator" role="separator" aria-hidden="true"></div>
          </div>
          <section className="d-c">
            <div className="gcs-1 gce-9 bp2:gce-3">
              <h2 className="Text size-2">Made for the makers</h2>
            </div>
            <ul
              className="List gcs-1 gce-9 bp3:gcs-3 d-g gtc-2 bp2:gtc-4 bp3:gtc-6 g-8 bp2:g-9"
              aria-label="companies using base ui"
            >
              <li>
                <div className="d-f fd-c g-2">
                  <div className="Figure" aria-hidden="true">
                    <div className="d-f ai-c jc-c h-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <path
                          d="M19.6749 0H4.91873V4.92314H19.6749V19.6923H4.91873V4.92314H0V19.6923V32H4.91873H19.6749V19.6923H31.9717V4.92314V0H19.6749Z"
                          fill="#2E2E2E"
                        />
                      </svg>
                    </div>
                  </div>
                  <span className="Text size-1">Paper</span>
                </div>
              </li>
              <li>
                <div className="d-f fd-c g-2">
                  <div className="Figure" aria-hidden="true">
                    <div className="d-f ai-c jc-c h-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_88_3019)">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M3 2C2.44772 2 2 2.44772 2 3V25H0V3C0 1.34315 1.34315 0 3 0H29.7929C31.1292 0 31.7985 1.61572 30.8535 2.56066L14.3517 19.0625H19V17H21V19.5625C21 20.3909 20.3284 21.0625 19.5 21.0625H12.3517L8.9142 24.5H24.5V12H26.5V24.5C26.5 25.6046 25.6046 26.5 24.5 26.5H6.9142L3.41422 30H29C29.5523 30 30 29.5523 30 29V7H32V29C32 30.6569 30.6569 32 29 32H2.20711C0.870748 32 0.201502 30.3843 1.14645 29.4393L17.5858 13H13V15H11V12.5C11 11.6716 11.6716 11 12.5 11H19.5858L23.0858 7.50002H7.50002V20H5.50002V7.50002C5.50002 6.39541 6.39541 5.50002 7.50002 5.50002H25.0858L28.5858 2H3Z"
                            fill="#2E2E2E"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_88_3019">
                            <rect width="32" height="32" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                  </div>
                  <span className="Text size-1">Zed</span>
                </div>
              </li>
              <li>
                <div className="d-f fd-c g-2">
                  <div className="Figure" aria-hidden="true">
                    <div className="d-f ai-c jc-c h-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <g clipPath="url(#clip0_88_3022)">
                          <path d="M10 9V0H22V9H10ZM22 14H32V32H0V14H10V23H22V14Z" fill="#2E2E2E" />
                        </g>
                        <defs>
                          <clipPath id="clip0_88_3022">
                            <rect width="32" height="32" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                  </div>
                  <span className="Text size-1">Unsplash</span>
                </div>
              </li>
              <li>
                <div className="d-f fd-c g-2">
                  <div className="Figure" aria-hidden="true">
                    <div className="d-f ai-c jc-c h-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="61"
                        height="32"
                        viewBox="0 0 61 32"
                        fill="none"
                      >
                        <path
                          d="M54.6779 0.924763C50.2554 0.377394 44.2469 4.0675 39.7431 9.68266C39.6554 9.79098 39.5381 9.87186 39.4054 9.91558C39.2726 9.95931 39.1299 9.96404 38.9945 9.92919C38.8591 9.89434 38.7367 9.8214 38.642 9.71912C38.5472 9.61684 38.4842 9.48956 38.4604 9.35255C38.069 7.01992 36.6897 5.44855 34.3903 5.1656C30.8625 4.72771 26.1587 7.43929 22.4106 11.6953C22.3202 11.7972 22.2028 11.8717 22.0717 11.9102C21.9407 11.9487 21.8013 11.9498 21.6697 11.9132C21.5381 11.8766 21.4195 11.8039 21.3276 11.7034C21.2357 11.6029 21.1741 11.4787 21.15 11.345C20.7772 9.29529 19.5402 7.91592 17.4967 7.66329C13.1844 7.13108 6.92001 11.8115 3.50401 18.1189C0.0880105 24.4246 0.813232 29.9707 5.12559 30.5029C8.10443 30.8734 12.0152 28.7513 15.2753 25.3256C15.3714 25.2257 15.4943 25.1553 15.6294 25.1227C15.7645 25.0901 15.9062 25.0967 16.0376 25.1418C16.1691 25.1868 16.2848 25.2684 16.371 25.3768C16.4572 25.4852 16.5104 25.6159 16.5241 25.7534C16.78 28.3909 18.1898 30.1913 20.6687 30.4978C24.1576 30.9307 28.7987 28.2831 32.5265 24.1046C32.6221 23.9983 32.7472 23.9225 32.8861 23.8867C33.025 23.851 33.1715 23.8569 33.307 23.9037C33.4425 23.9505 33.561 24.0362 33.6477 24.1498C33.7343 24.2635 33.7852 24.4001 33.7939 24.5424C33.982 27.8435 35.6425 30.1172 38.6637 30.4911C44.2452 31.1816 52.3548 25.1235 56.7773 16.9584C61.1998 8.7934 60.2594 1.61529 54.6779 0.924763Z"
                          fill="#2E2E2E"
                        />
                      </svg>
                    </div>
                  </div>
                  <span className="Text size-1">Operate</span>
                </div>
              </li>
              <li>
                <div className="d-f fd-c g-2">
                  <div className="Figure" aria-hidden="true">
                    <div className="d-f ai-c jc-c h-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                      >
                        <path
                          d="M0.799805 6.4002C0.799805 4.63288 2.21757 3.2002 3.96647 3.2002C5.71537 3.2002 7.13314 4.63288 7.13314 6.4002V25.6002C7.13314 27.3675 5.71537 28.8002 3.96647 28.8002C2.21757 28.8002 0.799805 27.3675 0.799805 25.6002V6.4002Z"
                          fill="#2E2E2E"
                        />
                        <path
                          d="M24.8667 6.4002C24.8667 4.63288 26.2845 3.2002 28.0334 3.2002C29.7823 3.2002 31.2001 4.63288 31.2001 6.4002V25.6002C31.2001 27.3675 29.7823 28.8002 28.0334 28.8002C26.2845 28.8002 24.8667 27.3675 24.8667 25.6002V6.4002Z"
                          fill="#2E2E2E"
                        />
                        <path
                          d="M23.5999 15.9998C23.5999 20.2413 20.1973 23.6798 15.9999 23.6798C11.8025 23.6798 8.3999 20.2413 8.3999 15.9998C8.3999 11.7583 11.8025 8.31982 15.9999 8.31982C20.1973 8.31982 23.5999 11.7583 23.5999 15.9998Z"
                          fill="#2E2E2E"
                        />
                      </svg>
                    </div>
                  </div>
                  <span className="Text size-1">Highlight AI</span>
                </div>
              </li>
              <li>
                <div className="d-f fd-c g-2">
                  <div className="Figure" aria-hidden="true">
                    <div className="d-f ai-c jc-c h-100">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="43"
                        height="32"
                        viewBox="0 0 43 32"
                        fill="none"
                      >
                        <path d="M0 15.2002H1.6V16.8002H0V15.2002Z" fill="#2E2E2E" />
                        <path d="M5.6001 8H8.8001V11.2H5.6001V8Z" fill="#2E2E2E" />
                        <path d="M5.6001 20.7998H8.8001V23.9998H5.6001V20.7998Z" fill="#2E2E2E" />
                        <path
                          d="M10.9331 0.533203H16.2664V5.86654H10.9331V0.533203Z"
                          fill="#2E2E2E"
                        />
                        <path d="M12 14.3999H15.2V17.5999H12V14.3999Z" fill="#2E2E2E" />
                        <path
                          d="M10.9331 26.1333H16.2664V31.4666H10.9331V26.1333Z"
                          fill="#2E2E2E"
                        />
                        <path
                          d="M17.3335 6.93311H22.6668V12.2664H17.3335V6.93311Z"
                          fill="#2E2E2E"
                        />
                        <path
                          d="M17.3335 19.7334H22.6668V25.0667H17.3335V19.7334Z"
                          fill="#2E2E2E"
                        />
                        <path d="M23.2002 0H29.6002V6.4H23.2002V0Z" fill="#2E2E2E" />
                        <path
                          d="M23.7334 13.3335H29.0667V18.6668H23.7334V13.3335Z"
                          fill="#2E2E2E"
                        />
                        <path
                          d="M23.2002 25.6001H29.6002V32.0001H23.2002V25.6001Z"
                          fill="#2E2E2E"
                        />
                        <path d="M29.6001 6.3999H36.0001V12.7999H29.6001V6.3999Z" fill="#2E2E2E" />
                        <path
                          d="M29.6001 19.2002H36.0001V25.6002H29.6001V19.2002Z"
                          fill="#2E2E2E"
                        />
                        <path d="M36 12.7998H42.4V19.1998H36V12.7998Z" fill="#2E2E2E" />
                      </svg>
                    </div>
                  </div>
                  <span className="Text size-1">Interfere</span>
                </div>
              </li>
            </ul>
          </section>
          <div className="gcs-1 gce-9 bp3:gcs-3">
            <div className="Separator" role="separator" aria-hidden="true"></div>
          </div>
          <section className="d-c">
            <div className="gcs-1 gce-9 bp2:gce-3">
              <h2 className="Text size-2">So you know who to blame</h2>
            </div>
            <div className="gcs-1 gce-9 bp2:gcs-3 bp4:gce-7">
              <ul
                className="List"
                aria-label="team members"
                style={{ borderTop: '1px solid currentColor' }}
              >
                <li className="ListItem d-g gtc-2 g-8 bp3:g-9">
                  <span className="Text size-2">Colm Tuite</span>
                  <span className="Text size-2">Director of Design Engineering</span>
                </li>
                <li className="ListItem d-g gtc-2 g-8 bp3:g-9">
                  <span className="Text size-2">Marija Najdova</span>
                  <span className="Text size-2">Director of Engineering</span>
                </li>
                <li className="ListItem d-g gtc-2 g-8 bp3:g-9">
                  <span className="Text size-2">Albert Yu</span>
                  <span className="Text size-2">Engineer</span>
                </li>
                <li className="ListItem d-g gtc-2 g-8 bp3:g-9">
                  <span className="Text size-2">Flavien Delangle</span>
                  <span className="Text size-2">Engineer</span>
                </li>
                <li className="ListItem d-g gtc-2 g-8 bp3:g-9">
                  <span className="Text size-2">James Nelson</span>
                  <span className="Text size-2">Engineer</span>
                </li>
                <li className="ListItem d-g gtc-2 g-8 bp3:g-9">
                  <span className="Text size-2">Lukas Tyla</span>
                  <span className="Text size-2">Engineer</span>
                </li>
                <li className="ListItem d-g gtc-2 g-8 bp3:g-9">
                  <span className="Text size-2">Michał Dudak</span>
                  <span className="Text size-2">Engineer</span>
                </li>
                <li className="ListItem d-g gtc-2 g-8 bp3:g-9">
                  <span className="Text size-2">Vlad Moroz</span>
                  <span className="Text size-2">Contributor</span>
                </li>
              </ul>
            </div>
          </section>
          <div className="gcs-1 gce-9 bp3:gcs-3">
            <div className="Separator" role="separator" aria-hidden="true"></div>
          </div>
          <section className="d-c">
            <div className="gcs-1 gce-9 bp2:gce-3">
              <h2 className="Text size-2">The fine print</h2>
            </div>
            <div className="gcs-1 gce-9 bp2:gcs-3 bp4:gce-7">
              <details style={{ borderTop: '1px solid currentColor' }}>
                <summary className="Text size-2">What is Base UI?</summary>
                <p className="Text size-2">
                  Base UI is a library of unstyled UI components for building accessible component
                  libraries, user interfaces, web applications, and websites with React. Base UI
                  components are highly configurable, composable, and customizable.
                </p>
              </details>
              <details>
                <summary className="Text size-2">
                  Does Base UI work with any styling library?
                </summary>
                <p className="Text size-2">
                  Yes. Base UI works with Tailwind, CSS Modules, CSS-in-JS, plain CSS, and any other
                  styling library you prefer. It also works with JavaScript animation libraries like
                  Motion, or just plain CSS transitions. Base UI is an unstyled component library.
                  The package does not bundle any CSS, and does not prescribe any styling solution.
                </p>
              </details>
              <details>
                <summary className="Text size-2">
                  Which accessibility standards does Base UI follow?
                </summary>
                <p className="Text size-2">
                  When designing and speccing components, we follow{' '}
                  <a className="Link" href="https://www.w3.org/WAI/ARIA/apg/patterns/">
                    ARIA Authoring Practices Guide patterns
                  </a>
                  , and comply with the{' '}
                  <a className="Link" href="https://www.w3.org/TR/WCAG22/#new-features-in-wcag-2-2">
                    WCAG 2.2 standard
                  </a>
                  . Base UI is compliant with all Success Criteria levels relating to component
                  behaviour. However, in most cases, we go way beyond these guides. Base UI
                  components are tested across a wide range of browsers, devices, platforms, and
                  environments, and are designed to be accessible.
                </p>
              </details>
              <details>
                <summary className="Text size-2">How does Base UI differ from Radix UI?</summary>
                <div className="d-f fd-c g-4">
                  <p className="Text size-2">
                    In terms of API design, both libraries are very similar. We intentionally kept
                    our APIs close to Radix UI for an easier migration path. Base UI provides more
                    complex components such as Combobox and Autocomplete. Base UI also provides
                    deeper feature support such as input scrubbing, nested dialogs, and triggering
                    menus on hover. Base UI is more robust and more polished in terms of a11y and
                    edge case handling.
                  </p>
                  <p className="Text size-2">
                    But the most important difference is that Base UI is actively maintained and
                    developed, with a dedicated team of 7 developers, designers, and managers
                    working on it full-time.
                  </p>
                </div>
              </details>
              <details>
                <summary className="Text size-2">Can I use Base UI without React?</summary>
                <p className="Text size-2">
                  Base UI is a React library. It is not designed to be used without React. We may
                  consider supporting other libraries at some point, but for the forseeable future,
                  React is our primary focus.
                </p>
              </details>
              <details>
                <summary className="Text size-2">Is Base UI free for commercial use?</summary>
                <p className="Text size-2">
                  Yes. Base UI is licensed under the MIT license, and is free for commercial use.
                  You are free to use it in your commercial projects, and to modify it to suit your
                  needs.
                </p>
              </details>
              <details>
                <summary className="Text size-2">Do you offer enterprise SLAs?</summary>
                <p className="Text size-2">
                  Not currently. We do provide dedicated support channels to some very large
                  enterprise companies who are working with us as design partners. But we do not
                  currently provide Service Level Agreements, guaranteed response times, issue
                  escalation, feature prioritization, or any other formal support guarantees.
                </p>
              </details>
            </div>
          </section>
        </main>
        <div className="gcs-1 gce-9 bp3:gcs-3">
          <div className="Separator" role="separator" aria-hidden="true"></div>
        </div>
        <footer className="d-c">
          <div className="gcs-1 gce-9 bp2:gce-3">
            <span className="Text size-1">© Base UI</span>
          </div>
          <nav className="d-f fd-c g-2 gcs-1 gce-9 bp2:gcs-3 bp4:gce-7" aria-label="social links">
            <a className="Text size-1 Link" href="https://x.com/base_ui">
              X
            </a>
            <a className="Text size-1 Link" href="https://github.com/mui/base-ui">
              GitHub
            </a>
            <a className="Text size-1 Link" href="https://discord.com/invite/g6C3hUtuxz">
              Discord
            </a>
            <a className="Text size-1 Link" href="https://www.npmjs.com/package/@base-ui/react">
              npm
            </a>
            <a
              className="Text size-1 Link"
              href="https://bsky.app/profile/did:plc:nwr6peuxqzdzlbi72qr5kldc"
            >
              BlueSky
            </a>
          </nav>
        </footer>
      </div>
    </React.Fragment>
  );
}

const description = 'Unstyled UI components for building accessible web apps and design systems.';

export const metadata: Metadata = {
  description,
  twitter: {
    description,
  },
  openGraph: {
    description,
  },
};

// Custom viewport for the homepage because on mobile it doesn't have a header
export const viewport: Viewport = {
  themeColor: [
    // Desktop Safari page background
    {
      media: '(prefers-color-scheme: light) and (min-width: 1024px)',
      color: 'oklch(95% 0.25% 264)',
    },
    {
      media: '(prefers-color-scheme: dark) and (min-width: 1024px)',
      color: 'oklch(25% 1% 264)',
    },

    // Mobile Safari header background (match the page content)
    {
      media: '(prefers-color-scheme: light)',
      color: '#FFF',
    },
    {
      media: '(prefers-color-scheme: dark)',
      color: '#000',
    },
  ],
};
