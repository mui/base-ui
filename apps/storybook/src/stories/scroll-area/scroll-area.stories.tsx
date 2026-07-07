import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { ScrollArea } from '@base-ui/react/scroll-area';
import styles from './scroll-area.module.css';

/**
 * Stories follow research/c-components/scroll-area (Tier 2, floor coverage):
 * the hero recreation (Root+Viewport+Content+Scrollbar+Thumb+Corner, fixed
 * height + long content), a horizontal-only variant, a both-axes grid with
 * Corner, and a dedicated overflow-edge data-attribute styling story. No
 * popup/portal parts are involved — Scroll Area decorates native scrolling,
 * it does not open/close anything.
 */
const meta = {
  title: 'Disclosure & structure/Scroll Area',
  component: ScrollArea.Root,
  subcomponents: {
    'ScrollArea.Viewport': ScrollArea.Viewport,
    'ScrollArea.Content': ScrollArea.Content,
    'ScrollArea.Scrollbar': ScrollArea.Scrollbar,
    'ScrollArea.Thumb': ScrollArea.Thumb,
    'ScrollArea.Corner': ScrollArea.Corner,
  },
} satisfies Meta<typeof ScrollArea.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

const paragraphs = [
  `Vernacular architecture is building done outside any academic tradition, and without
  professional guidance. It is not a particular architectural movement or style, but
  rather a broad category, encompassing a wide range and variety of building types, with
  differing methods of construction, from around the world, both historical and extant and
  classical and modern. Vernacular architecture constitutes 95% of the world's built
  environment, as estimated in 1995 by Amos Rapoport, as measured against the small
  percentage of new buildings every year designed by architects and built by engineers.`,
  `This type of architecture usually serves immediate, local needs, is constrained by the
  materials available in its particular region and reflects local traditions and cultural
  practices. The study of vernacular architecture does not examine formally schooled
  architects, but instead that of the design skills and tradition of local builders, who
  were rarely given any attribution for the work. More recently, vernacular architecture
  has been examined by designers and the building industry in an effort to be more energy
  conscious with contemporary design and construction—part of a broader interest in
  sustainable design.`,
];

/** The docs hero demo: a fixed-height panel of long text content with a single vertical scrollbar whose opacity is gated on `[data-hovering]`/`[data-scrolling]`. `Corner` is composed per the canonical anatomy, but only renders once both axes overflow simultaneously — here it stays absent. */
export const Hero: Story = {
  render: () => (
    <ScrollArea.Root className={styles.ScrollArea}>
      <ScrollArea.Viewport className={styles.Viewport}>
        <ScrollArea.Content className={styles.Content}>
          {paragraphs.map((text, index) => (
            <p key={index} className={styles.Paragraph}>
              {text}
            </p>
          ))}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className={styles.Scrollbar}>
        <ScrollArea.Thumb className={styles.Thumb} />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner className={styles.Corner} />
    </ScrollArea.Root>
  ),
  play: async ({ canvasElement }) => {
    // The vertical Scrollbar renders (content overflows the fixed height)
    // and carries the orientation data attribute used for styling.
    const scrollbar = canvasElement.querySelector('[data-orientation="vertical"]');
    await waitFor(() => expect(scrollbar).not.toBeNull());
    await expect(scrollbar).toBeInTheDocument();
  },
};

/** A single horizontal `Scrollbar` over a wide row of cards. `orientation="horizontal"` is the only way to get a horizontal scrollbar — there is no `orientation="both"`; render two `Scrollbar` elements for that (see `BothAxesWithCorner`). */
export const HorizontalOnly: Story = {
  render: () => (
    <ScrollArea.Root className={styles.ScrollArea}>
      <ScrollArea.Viewport className={styles.Viewport}>
        <ScrollArea.Content className={styles.ContentPadded}>
          <div className={styles.Row}>
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index} className={styles.Card}>
                Card {index + 1}
              </div>
            ))}
          </div>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className={styles.Scrollbar} orientation="horizontal">
        <ScrollArea.Thumb className={styles.Thumb} />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  ),
  play: async ({ canvasElement }) => {
    const scrollbar = canvasElement.querySelector('[data-orientation="horizontal"]');
    await waitFor(() => expect(scrollbar).not.toBeNull());
    await expect(scrollbar).toBeInTheDocument();
  },
};

/** Recreation of the docs "both" demo: a 100-item grid overflows on both axes, so a vertical and a horizontal `Scrollbar` are both rendered, plus `ScrollArea.Corner` — which only renders once both axes overflow simultaneously (`hiddenState.corner`), preventing the two scrollbar tracks from intersecting. */
export const BothAxesWithCorner: Story = {
  render: () => (
    <ScrollArea.Root className={styles.ScrollAreaSquare}>
      <ScrollArea.Viewport className={styles.Viewport}>
        <ScrollArea.Content className={styles.ContentPadded}>
          <ul className={styles.Grid}>
            {Array.from({ length: 100 }, (_, index) => (
              <li key={index} className={styles.Item}>
                {index + 1}
              </li>
            ))}
          </ul>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className={styles.Scrollbar}>
        <ScrollArea.Thumb className={styles.Thumb} />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar className={styles.Scrollbar} orientation="horizontal">
        <ScrollArea.Thumb className={styles.Thumb} />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner className={styles.Corner} />
    </ScrollArea.Root>
  ),
  play: async ({ canvasElement }) => {
    // Both axes overflow the fixed 20rem x 20rem viewport, so both
    // scrollbars — and the Corner that keeps them from intersecting — render.
    const vertical = canvasElement.querySelector('[data-orientation="vertical"]');
    const horizontal = canvasElement.querySelector('[data-orientation="horizontal"]');
    await waitFor(() => expect(vertical).not.toBeNull());
    await waitFor(() => expect(horizontal).not.toBeNull());
    await expect(vertical).toBeInTheDocument();
    await expect(horizontal).toBeInTheDocument();
  },
};

function OverflowDataAttributeExample() {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = React.useState(true);
  const [atEnd, setAtEnd] = React.useState(false);

  const readEdges = React.useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }
    setAtStart(viewport.getAttribute('data-overflow-y-start') === null);
    setAtEnd(viewport.getAttribute('data-overflow-y-end') === null);
  }, []);

  return (
    <div>
      <ScrollArea.Root className={styles.ScrollArea}>
        <ScrollArea.Viewport
          ref={viewportRef}
          className={styles.Viewport}
          data-testid="edge-viewport"
          onScroll={readEdges}
        >
          <ScrollArea.Content className={styles.Content}>
            {paragraphs.map((text, index) => (
              <p key={index} className={styles.Paragraph}>
                {text}
              </p>
            ))}
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar className={styles.Scrollbar}>
          <ScrollArea.Thumb className={styles.Thumb} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
      <div className={styles.Legend}>
        <span className={styles.Badge} data-active={String(atStart)}>
          at start edge
        </span>
        <span className={styles.Badge} data-active={String(atEnd)}>
          at end edge
        </span>
      </div>
    </div>
  );
}

/** `data-overflow-y-start`/`-y-end` (and their `x` counterparts) appear on the Viewport only once the user has scrolled far enough away from that specific edge (gated by `overflowEdgeThreshold`, default `0`). These — plus the matching `--scroll-area-overflow-{x,y}-{start,end}` CSS vars — are the primary styling surface for gradient scroll-fade masks; they are honest, programmatically-derived measurements, not decorative-only attributes. */
export const OverflowEdgeStyling: Story = {
  render: () => <OverflowDataAttributeExample />,
  play: async ({ canvasElement }) => {
    const viewport = canvasElement.querySelector('[data-testid="edge-viewport"]') as HTMLElement | null;
    await waitFor(() => expect(viewport).not.toBeNull());
    await waitFor(() => expect(viewport).toHaveAttribute('data-has-overflow-y'));
    // At rest, scrolled to the top: the start-edge attribute is absent.
    await expect(viewport).not.toHaveAttribute('data-overflow-y-start');

    // Scrolling down produces both the start (scrolled away from top) and
    // end (more content below) edge attributes.
    viewport!.scrollTop = 40;
    viewport!.dispatchEvent(new Event('scroll', { bubbles: true }));
    await waitFor(() => expect(viewport).toHaveAttribute('data-overflow-y-start'));

    // Scrolling all the way to the bottom drops the end-edge attribute.
    viewport!.scrollTop = viewport!.scrollHeight;
    viewport!.dispatchEvent(new Event('scroll', { bubbles: true }));
    await waitFor(() => expect(viewport).not.toHaveAttribute('data-overflow-y-end'));
  },
};
