import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Slider } from '@base-ui/react/slider';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import styles from './direction-provider.module.css';

/**
 * Stories follow research/c-components/direction-provider (Tier 3 utils
 * floor): `DirectionProvider` renders no DOM of its own — it only configures
 * *behavior* (arrow-key direction, positioning sides) for descendant Base UI
 * components. It never sets `dir`/CSS itself (brief §2, #831), so every story
 * pairs it with an app-owned `dir="rtl"` on the container, per the docs.
 */
const meta = {
  title: 'Utilities/Direction Provider',
  component: DirectionProvider,
  tags: ['ai-generated'],
} satisfies Meta<typeof DirectionProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The docs hero pattern: `dir="rtl"` on the container (visual direction, owned by the app) paired with `DirectionProvider direction="rtl"` (behavioral direction, owned by Base UI) — the two-part RTL setup decided in #831. */
export const Hero: Story = {
  render: () => (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <Slider.Root defaultValue={25}>
          <Slider.Control className={styles.Control}>
            <Slider.Track className={styles.Track}>
              <Slider.Indicator className={styles.Indicator} />
              <Slider.Thumb aria-label="Volume" className={styles.Thumb} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      </DirectionProvider>
    </div>
  ),
};

/** The behavior the provider exists for: composite keyboard navigation flips with direction. `useCompositeRoot` swaps the "forward" arrow key in RTL (`ArrowLeft` instead of `ArrowRight`) — this is a real interaction change, not a visual one, and it only happens because `DirectionProvider` tells the `ToggleGroup` its direction is RTL. */
export const FlipCompositeRTL: Story = {
  render: () => (
    <div dir="rtl">
      <DirectionProvider direction="rtl">
        <ToggleGroup aria-label="Text alignment" defaultValue={['left']} className={styles.Panel}>
          <Toggle aria-label="Align left" value="left" className={styles.Button}>
            L
          </Toggle>
          <Toggle aria-label="Align center" value="center" className={styles.Button}>
            C
          </Toggle>
          <Toggle aria-label="Align right" value="right" className={styles.Button}>
            R
          </Toggle>
        </ToggleGroup>
      </DirectionProvider>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const left = canvas.getByRole('button', { name: 'Align left' });
    const center = canvas.getByRole('button', { name: 'Align center' });

    await userEvent.tab();
    await expect(left).toHaveFocus();

    // In RTL, ArrowLeft is the "forward" key (useCompositeRoot.ts): focus
    // moves to the next item, mirroring what ArrowRight does in LTR.
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(center).toHaveFocus());
  },
};
