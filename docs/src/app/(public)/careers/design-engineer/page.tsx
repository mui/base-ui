import * as React from 'react';
import type { Metadata, Viewport } from 'next';
import { Link } from 'docs/src/components/Link';
import { ArrowRightIcon } from 'docs/src/icons/ArrowRightIcon';
import { Header } from 'docs/src/components/Header';
import '../../page.css';
import '../../(content)/layout.css';

export default function Homepage() {
  return (
    <div className="HomepageRoot">
      <Header />
      <div className="ContentLayoutMain">
        <h1 className="mb-4 text-3xl font-bold text-balance">Design Engineer</h1>
        <p className="-mt-2 mb-5 text-lg text-pretty text-gray">
          Help us make Base UI the most intuitive, accessible, and powerful
          open-source UI library for React.
        </p>
        <h2 className="mt-10 mb-4 scroll-mt-6 text-xl font-medium text-balance">
          About Base UI
        </h2>
        <p className="mb-4">
          From the creators of Radix, Material UI, and Floating UI, Base UI is an
          unstyled React component library for building accessible user interfaces.
          Our focus is on accessibility, performance, and developer experience. Our
          goal is to provide a complete set of open-source UI components, with a
          delightful developer experience, in a sustainable way.
        </p>
        <p className="mb-4">
          The Base UI team is a small group of engineers, designers, and product
          people, working to solve incredibly complex and challenging UI problems on
          the web. In our work, we value craft, flexibility, and accessibility.
        </p>
        <h2 className="mt-10 mb-4 scroll-mt-6 text-xl font-medium text-balance">
          The role
        </h2>
        <p className="mb-4">
          We're looking for an experienced Design Engineer to join the team at
          Senior–Principal level. You will help us improve the library across the
          board, including API design, performance, a11y, testing workflows, docs,
          support, and implementing components.
        </p>
        <p className="mb-4">
          We're looking for someone who enjoys wearing many hats. Think less about
          spending many months implementing a single component, and more about
          leading developer experience, API design, a11y, docs, and maintaining
          overall product quality.
        </p>
        <p className="mb-4">
          You will have a lot of autonomy to push for improvements. We are looking
          for someone who is passionate about UI design, with an exceptional eye for
          detail, and great taste in both visual design and API design.
        </p>
        <h2 className="mt-10 mb-4 scroll-mt-6 text-xl font-medium text-balance">
          Responsibilities
        </h2>
        <ul className="mb-4 ml-4.5 list-disc">
          <li className="mb-0.5">Report to our OSS Engineering Manager.</li>
          <li className="mb-0.5">
            Contribute to the component design process through a11y research, user
            research, writing design specs, collaborating with engineers, and
            exploring UI design patterns on both web and mobile.
          </li>
          <li className="mb-0.5">
            Contribute to the API design process at both the component level and the
            library level. Work to ensure APIs are intuitive, configurable, and
            consistent.
          </li>
          <li className="mb-0.5">
            Lead the docs design and user experience. Design and implement new
            features, new content, a11y enhancements, and visual language
            enhancements.
          </li>
          <li className="mb-0.5">Build and maintain the Base UI website.</li>
          <li className="mb-0.5">
            Build out our test environment by composing and styling component
            examples, then rigorously testing them in many different environments
            including desktop, mobile, and screen readers.
          </li>
          <li className="mb-0.5">
            Create a healthy feedback loop with the engineering team, pushing for
            iterative improvements to accessibility, usability, and performance.
          </li>
          <li className="mb-0.5">
            Champion Base UI both internally and externally, contributing to
            marketing efforts through social media, blogs, conference talks,
            podcasts, and other communication channels.
          </li>
          <li className="mb-0.5">
            Help out with developer support on both Github and Discord.
          </li>
        </ul>
        <h2 className="mt-10 mb-4 scroll-mt-6 text-xl font-medium text-balance">
          Requirements
        </h2>
        <ul className="mb-4 ml-4.5 list-disc">
          <li className="mb-0.5">
            We are targeting 7+ years of web development experience.
          </li>
          <li className="mb-0.5">
            Working knowledge of React, TypeScript, Next.js, MDX, Git, Figma, and
            other popular tools in the React, JavaScript, and design ecosystems.
          </li>
          <li className="mb-0.5">
            Expert knowledge of CSS, including familiarity with common CSS tooling,
            and knowledge of bleeding-edge CSS features.
          </li>
          <li className="mb-0.5">
            Deep familiarity with the headless UI ecosystem. Strong opinions on the
            pros and cons of API design choices across headless UI libraries.
          </li>
          <li className="mb-0.5">
            Expert knowledge of a11y, including deep familiarity with ARIA
            guidelines, WCAG success criterion, and screen reader technologies.
          </li>
          <li className="mb-0.5">Advanced understanding of design principles.</li>
          <li className="mb-0.5">
            A passion for craft, a keen eye for detail, and exquisite taste.
          </li>
          <li className="mb-0.5">
            Excellent written and verbal communication skills.
          </li>
          <li className="mb-0.5">
            Experience working remotely and communicating asynchronously.
          </li>
        </ul>
        <h2 className="mt-10 mb-4 scroll-mt-6 text-xl font-medium text-balance">
          Benefits
        </h2>
        <ul className="mb-4 ml-4.5 list-disc">
          <li className="mb-0.5">$200k–$290k USD base salary.</li>
          <li className="mb-0.5">
            Subsidized healthcare package (dependent on employment path and
            location).
          </li>
          <li className="mb-0.5">
            Flexible time-off. We provide 33 days of paid time-off globally.
          </li>
          <li className="mb-0.5">
            100% remote. Our entire company is globally distributed.
          </li>
          <li className="mb-0.5">
            Company retreats. We meet up every 8 months for a week of work and fun.
          </li>
          <li className="mb-0.5">
            Office equipment. We let you choose the hardware of your choice.
          </li>
          <li className="mb-0.5">
            20% time. Allocate 20% of your time towards personal and professional
            development.
          </li>
          <li className="mb-0.5">
            Education budget. We provide mentorship and send you to events that help
            you build your network and skills.
          </li>
        </ul>
        <p className="mb-4">
          The actual salary will be determined by skill-level, experience, and
          location. More information about the specific compensation package will be
          shared during the hiring process.
        </p>
        <h2 className="mt-10 mb-4 scroll-mt-6 text-xl font-medium text-balance">
          Application
        </h2>
        <p className="mb-4">The hiring process will consist of 5 stages:</p>
        <ol className="mb-4 ml-4.5 list-inside list-decimal">
          <li className="mb-0.5">Resume review.</li>
          <li className="mb-0.5">React challenge (asynchronous).</li>
          <li className="mb-0.5">60-minute meeting with Colm (Product lead).</li>
          <li className="mb-0.5">90-minute meeting with the Base UI team.</li>
          <li className="mb-0.5">
            60-minute meeting with Marija (Engineering Manager).
          </li>
        </ol>
        <Link
          className="-m-1 inline-flex items-center gap-1 p-1"
          href="/react/overview/quick-start"
        >
          Apply Now <ArrowRightIcon />
        </Link>
      </div>
    </div>
  );
}

const description =
  'Unstyled UI components for building accessible web apps and design systems.';

export const metadata: Metadata = {
  description,
  twitter: {
    description,
  },
  openGraph: {
    description,
  },
};

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

    // Mobile Safari header background (match the page)
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
