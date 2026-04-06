import { expect, vi } from 'vitest';
import { fireEvent, screen } from '@mui/internal-test-utils';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Accordion } from '@base-ui/react/accordion';
import { createRenderer, describeConformance, isJSDOM } from '#test-utils';

const PANEL_CONTENT_1 = 'Panel contents 1';
const PANEL_CONTENT_2 = 'Panel contents 2';

describe('<Accordion.Root />', () => {
  const { render } = createRenderer();

  describeConformance(<Accordion.Root />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('ARIA attributes', () => {
    it('renders correct ARIA attributes', async () => {
      const { container } = await render(
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const root = container.firstElementChild as HTMLElement;
      const trigger = screen.getByRole('button');
      const panel = screen.queryByText(PANEL_CONTENT_1) as HTMLElement;

      expect(root).toHaveAttribute('role', 'region');
      expect(trigger).toHaveAttribute('aria-controls');
      expect(panel.getAttribute('id')).toBe(trigger.getAttribute('aria-controls'));
      expect(panel).toHaveAttribute('role', 'region');
      expect(trigger.getAttribute('id')).toBe(panel.getAttribute('aria-labelledby'));
    });

    it('references manual panel id in trigger aria-controls', async () => {
      await render(
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel id="custom-panel-id">{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger = screen.getByRole('button');
      const panel = screen.queryByText(PANEL_CONTENT_1) as HTMLElement;

      expect(trigger).toHaveAttribute('aria-controls', 'custom-panel-id');
      expect(panel).toHaveAttribute('id', 'custom-panel-id');
    });
  });

  describe('uncontrolled', () => {
    it.skipIf(isJSDOM)('open state', async () => {
      const { user } = await render(
        <Accordion.Root>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger = screen.getByRole('button');

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null);

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('data-panel-open');
      expect(screen.queryByText(PANEL_CONTENT_1)).not.toBe(null);
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute('data-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null);
    });

    describe('prop: defaultValue', () => {
      it('custom item value', async () => {
        await render(
          <Accordion.Root defaultValue={['first']}>
            <Accordion.Item value="first">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="second">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        expect(screen.queryByText(PANEL_CONTENT_1)).not.toBe(null);
        expect(screen.queryByText(PANEL_CONTENT_1)).toBeVisible();
        expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute('data-open');

        expect(screen.queryByText(PANEL_CONTENT_2)).toBe(null);
      });
    });
  });

  describe('controlled', () => {
    it.skipIf(isJSDOM)('open state', async () => {
      const { setProps } = await render(
        <Accordion.Root value={[]}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const trigger = screen.getByRole('button');

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null);

      await setProps({ value: [0] });

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(trigger).toHaveAttribute('data-panel-open');
      expect(screen.queryByText(PANEL_CONTENT_1)).not.toBe(null);
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute('data-open');

      await setProps({ value: [] });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null);
    });

    describe('prop: value', () => {
      it('custom item value', async () => {
        await render(
          <Accordion.Root value={['one']}>
            <Accordion.Item value="one">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="second">
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        expect(screen.queryByText(PANEL_CONTENT_1)).not.toBe(null);
        expect(screen.queryByText(PANEL_CONTENT_1)).toBeVisible();
        expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute('data-open');

        expect(screen.queryByText(PANEL_CONTENT_2)).toBe(null);
      });
    });
  });

  describe('prop: disabled', () => {
    it('can disable the whole accordion', async () => {
      await render(
        <Accordion.Root defaultValue={[0]} disabled>
          <Accordion.Item data-testid="item1" value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item data-testid="item2" value={1}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const item1 = screen.getByTestId('item1');
      const panel1 = screen.queryByText(PANEL_CONTENT_1);
      const [header1, header2] = screen.getAllByRole('heading');
      const [trigger1, trigger2] = screen.getAllByRole('button');
      const item2 = screen.getByTestId('item2');

      [item1, header1, trigger1, panel1, item2, header2, trigger2].forEach((element) => {
        expect(element).toHaveAttribute('data-disabled');
      });
    });

    it('can disable one accordion item', async () => {
      await render(
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item data-testid="item1" value={0} disabled>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item data-testid="item2" value={1}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const item1 = screen.getByTestId('item1');
      const panel1 = screen.queryByText(PANEL_CONTENT_1);
      const [header1, header2] = screen.getAllByRole('heading');
      const [trigger1, trigger2] = screen.getAllByRole('button');
      const item2 = screen.getByTestId('item2');

      [item1, header1, trigger1, panel1].forEach((element) => {
        expect(element).toHaveAttribute('data-disabled');
      });
      [item2, header2, trigger2].forEach((element) => {
        expect(element).not.toHaveAttribute('data-disabled');
      });
    });
  });

  it('allows onMouseUp to call preventBaseUIHandler on the trigger', async () => {
    await render(
      <Accordion.Root>
        <Accordion.Item value={0}>
          <Accordion.Header>
            <Accordion.Trigger onMouseUp={(event) => event.preventBaseUIHandler()}>
              Trigger 1
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger 1' });

    expect(() => fireEvent.mouseUp(trigger)).not.toThrow();
  });

  describe.skipIf(isJSDOM)('keyboard interactions', () => {
    [true, false].forEach((isNativeButton) => {
      describe(`rendering ${isNativeButton ? 'interactive' : 'non-interactive'} triggers`, () => {
        ['Enter', 'Space'].forEach((key) => {
          it(`key: ${key} toggles the Accordion open state`, async () => {
            const { user } = await render(
              <Accordion.Root>
                <Accordion.Item>
                  <Accordion.Header>
                    <Accordion.Trigger
                      nativeButton={isNativeButton}
                      render={isNativeButton ? undefined : <span />}
                    >
                      Trigger 1
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
                </Accordion.Item>
              </Accordion.Root>,
            );

            const trigger = screen.getByRole('button');

            expect(trigger).toHaveAttribute('aria-expanded', 'false');

            expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null);

            await user.keyboard('[Tab]');
            expect(trigger).toHaveFocus();
            await user.keyboard(`[${key}]`);

            expect(trigger).toHaveAttribute('aria-expanded', 'true');
            expect(trigger).toHaveAttribute('data-panel-open');
            expect(screen.queryByText(PANEL_CONTENT_1)).not.toBe(null);
            expect(screen.queryByText(PANEL_CONTENT_1)).toBeVisible();
            expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute('data-open');

            await user.keyboard(`[${key}]`);

            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null);
          });
        });

        it('ArrowUp and ArrowDown moves focus between triggers and loops by default', async () => {
          const { user } = await render(
            <Accordion.Root>
              <Accordion.Item>
                <Accordion.Header>
                  <Accordion.Trigger
                    nativeButton={isNativeButton}
                    render={isNativeButton ? undefined : <span />}
                  >
                    Trigger 1
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>1</Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item>
                <Accordion.Header>
                  <Accordion.Trigger>Trigger 2</Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>2</Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>,
          );

          const [trigger1, trigger2] = screen.getAllByRole('button');

          await user.keyboard('[Tab]');
          expect(trigger1).toHaveFocus();

          await user.keyboard('[ArrowDown]');
          expect(trigger2).toHaveFocus();

          await user.keyboard('[ArrowUp]');
          expect(trigger1).toHaveFocus();

          await user.keyboard('[ArrowDown]');
          expect(trigger2).toHaveFocus();

          await user.keyboard('[ArrowDown]');
          expect(trigger1).toHaveFocus();
        });

        it('Arrow keys should not put focus on disabled accordion items', async () => {
          const { user } = await render(
            <Accordion.Root>
              <Accordion.Item>
                <Accordion.Header>
                  <Accordion.Trigger
                    nativeButton={isNativeButton}
                    render={isNativeButton ? undefined : <span />}
                  >
                    Trigger 1
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>1</Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item disabled>
                <Accordion.Header>
                  <Accordion.Trigger>Trigger 2</Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>2</Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item>
                <Accordion.Header>
                  <Accordion.Trigger>Trigger 3</Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>This is the contents of Accordion.Panel 3</Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>,
          );

          const [trigger1, , trigger3] = screen.getAllByRole('button');

          await user.keyboard('[Tab]');
          expect(trigger1).toHaveFocus();

          await user.keyboard('[ArrowDown]');
          expect(trigger3).toHaveFocus();

          await user.keyboard('[ArrowUp]');
          expect(trigger1).toHaveFocus();
        });

        describe('key: End/Home', () => {
          it('End key moves focus to the last trigger', async () => {
            const { user } = await render(
              <Accordion.Root>
                <Accordion.Item>
                  <Accordion.Header>
                    <Accordion.Trigger
                      nativeButton={isNativeButton}
                      render={isNativeButton ? undefined : <span />}
                    >
                      Trigger 1
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel>1</Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item disabled>
                  <Accordion.Header>
                    <Accordion.Trigger>Trigger 2</Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel>2</Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item>
                  <Accordion.Header>
                    <Accordion.Trigger>Trigger 3</Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel>This is the contents of Accordion.Panel 3</Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item>
                  <Accordion.Header>
                    <Accordion.Trigger>Trigger 4</Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel>This is the contents of Accordion.Panel 4</Accordion.Panel>
                </Accordion.Item>
              </Accordion.Root>,
            );

            const [trigger1, , , trigger4] = screen.getAllByRole('button');

            await user.keyboard('[Tab]');
            expect(trigger1).toHaveFocus();

            await user.keyboard('[End]');
            expect(trigger4).toHaveFocus();
          });

          it('Home key moves focus to the first trigger', async () => {
            const { user } = await render(
              <Accordion.Root>
                <Accordion.Item>
                  <Accordion.Header>
                    <Accordion.Trigger
                      nativeButton={isNativeButton}
                      render={isNativeButton ? undefined : <span />}
                    >
                      Trigger 1
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel>1</Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item disabled>
                  <Accordion.Header>
                    <Accordion.Trigger>Trigger 2</Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel>2</Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item>
                  <Accordion.Header>
                    <Accordion.Trigger>Trigger 3</Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel>This is the contents of Accordion.Panel 3</Accordion.Panel>
                </Accordion.Item>
                <Accordion.Item>
                  <Accordion.Header>
                    <Accordion.Trigger>Trigger 4</Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel>This is the contents of Accordion.Panel 4</Accordion.Panel>
                </Accordion.Item>
              </Accordion.Root>,
            );

            const [trigger1, , , trigger4] = screen.getAllByRole('button');

            await user.pointer({ keys: '[MouseLeft]', target: trigger4 });
            expect(trigger4).toHaveFocus();

            await user.keyboard('[Home]');
            expect(trigger1).toHaveFocus();
          });
        });
      });
    });

    it('does not affect composite keys on interactive elements in the panel', async () => {
      const { user } = await render(
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>
              <input type="text" defaultValue="abcd" />
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value={1}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const input = screen.getByRole('textbox') as HTMLInputElement;

      await user.keyboard('[Tab]');
      await user.keyboard('[Tab]');
      expect(input).toHaveFocus();

      // Firefox doesn't support document.getSelection() in inputs
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(4);

      await user.keyboard('[ArrowLeft]');
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(0);
    });

    describe('prop: loopFocus', () => {
      it('can disable focus looping between triggers', async () => {
        const { user } = await render(
          <Accordion.Root loopFocus={false}>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>1</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>2</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const [trigger1, trigger2] = screen.getAllByRole('button');

        await user.keyboard('[Tab]');
        expect(trigger1).toHaveFocus();

        await user.keyboard('[ArrowDown]');
        expect(trigger2).toHaveFocus();

        await user.keyboard('[ArrowDown]');
        expect(trigger2).toHaveFocus();
      });
    });
  });

  describe('keyboard activation timing', () => {
    [true, false].forEach((isNativeButton) => {
      it(`opens and closes on Space keydown when rendering ${
        isNativeButton ? 'interactive' : 'non-interactive'
      } triggers`, async () => {
        const onOpenChange = vi.fn();

        const { user } = await render(
          <Accordion.Root>
            <Accordion.Item onOpenChange={onOpenChange}>
              <Accordion.Header>
                <Accordion.Trigger
                  nativeButton={isNativeButton}
                  render={isNativeButton ? undefined : <span />}
                >
                  Trigger 1
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>,
        );

        const trigger = screen.getByRole('button');

        await user.keyboard('[Tab]');
        expect(trigger).toHaveFocus();

        fireEvent.keyDown(trigger, { key: ' ' });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.queryByText(PANEL_CONTENT_1)).not.toBe(null);
        expect(onOpenChange.mock.calls.length).toBe(1);
        expect(onOpenChange.mock.calls[0][0]).toBe(true);

        fireEvent.keyUp(trigger, { key: ' ' });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(onOpenChange.mock.calls.length).toBe(1);

        fireEvent.keyDown(trigger, { key: ' ' });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null);
        expect(onOpenChange.mock.calls.length).toBe(2);
        expect(onOpenChange.mock.calls[1][0]).toBe(false);

        fireEvent.keyUp(trigger, { key: ' ' });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(onOpenChange.mock.calls.length).toBe(2);
      });
    });
  });

  describe.skipIf(isJSDOM)('prop: multiple', () => {
    it('multiple items can be open when `multiple = true`', async () => {
      const { user } = await render(
        <Accordion.Root multiple>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = screen.getAllByRole('button');

      expect(trigger1).not.toHaveAttribute('data-panel-open');
      expect(trigger2).not.toHaveAttribute('data-panel-open');
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null);
      expect(screen.queryByText(PANEL_CONTENT_2)).toBe(null);

      await user.pointer({ keys: '[MouseLeft]', target: trigger1 });
      await user.pointer({ keys: '[MouseLeft]', target: trigger2 });

      expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute('data-open');
      expect(screen.queryByText(PANEL_CONTENT_2)).toHaveAttribute('data-open');
      expect(trigger1).toHaveAttribute('data-panel-open');
      expect(trigger2).toHaveAttribute('data-panel-open');
    });

    it('when false only one item can be open', async () => {
      const { user } = await render(
        <Accordion.Root multiple={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = screen.getAllByRole('button');

      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null);
      expect(screen.queryByText(PANEL_CONTENT_2)).toBe(null);
      expect(trigger1).not.toHaveAttribute('data-panel-open');
      expect(trigger2).not.toHaveAttribute('data-panel-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger1 });

      expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute('data-open');
      expect(trigger1).toHaveAttribute('data-panel-open');

      await user.pointer({ keys: '[MouseLeft]', target: trigger2 });

      expect(screen.queryByText(PANEL_CONTENT_2)).toHaveAttribute('data-open');
      expect(trigger2).toHaveAttribute('data-panel-open');
      expect(screen.queryByText(PANEL_CONTENT_1)).toBe(null);
      expect(trigger1).not.toHaveAttribute('data-panel-open');
    });
  });

  describe.skipIf(isJSDOM)('horizontal orientation', () => {
    it('ArrowLeft/Right moves focus in horizontal orientation', async () => {
      const { user } = await render(
        <Accordion.Root orientation="horizontal">
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = screen.getAllByRole('button');

      await user.keyboard('[Tab]');
      expect(trigger1).toHaveFocus();

      await user.keyboard('[ArrowRight]');
      expect(trigger2).toHaveFocus();

      await user.keyboard('[ArrowLeft]');
      expect(trigger1).toHaveFocus();

      await user.keyboard('[ArrowRight]');
      expect(trigger2).toHaveFocus();

      await user.keyboard('[ArrowRight]');
      expect(trigger1).toHaveFocus();
    });

    describe.skipIf(isJSDOM)('RTL', () => {
      it('ArrowLeft/Right is reversed for horizontal accordions in RTL mode', async () => {
        const { user } = await render(
          <DirectionProvider direction="rtl">
            <Accordion.Root orientation="horizontal">
              <Accordion.Item>
                <Accordion.Header>
                  <Accordion.Trigger>Trigger 1</Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>1</Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item>
                <Accordion.Header>
                  <Accordion.Trigger>Trigger 2</Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel>2</Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
          </DirectionProvider>,
        );

        const [trigger1, trigger2] = screen.getAllByRole('button');

        await user.keyboard('[Tab]');
        expect(trigger1).toHaveFocus();

        await user.keyboard('[ArrowLeft]');
        expect(trigger2).toHaveFocus();

        await user.keyboard('[ArrowRight]');
        expect(trigger1).toHaveFocus();

        await user.keyboard('[ArrowLeft]');
        expect(trigger2).toHaveFocus();

        await user.keyboard('[ArrowLeft]');
        expect(trigger1).toHaveFocus();
      });
    });
  });

  describe.skipIf(isJSDOM)('prop: onValueChange', () => {
    it('default item value', async () => {
      const onValueChange = vi.fn();

      const { user } = await render(
        <Accordion.Root onValueChange={onValueChange} multiple>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value={1}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = screen.getAllByRole('button');

      expect(onValueChange.mock.calls.length).toBe(0);

      await user.pointer({ keys: '[MouseLeft]', target: trigger1 });

      expect(onValueChange.mock.calls.length).toBe(1);
      expect(onValueChange.mock.lastCall?.[0]).toEqual([0]);

      await user.pointer({ keys: '[MouseLeft]', target: trigger2 });

      expect(onValueChange.mock.calls.length).toBe(2);
      expect(onValueChange.mock.lastCall?.[0]).toEqual([0, 1]);
    });

    it('custom item value', async () => {
      const onValueChange = vi.fn();

      const { user } = await render(
        <Accordion.Root onValueChange={onValueChange} multiple>
          <Accordion.Item value="one">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="two">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = screen.getAllByRole('button');

      expect(onValueChange.mock.calls.length).toBe(0);

      await user.pointer({ keys: '[MouseLeft]', target: trigger2 });

      expect(onValueChange.mock.calls.length).toBe(1);
      expect(onValueChange.mock.calls[0][0]).toEqual(['two']);

      await user.pointer({ keys: '[MouseLeft]', target: trigger1 });

      expect(onValueChange.mock.calls.length).toBe(2);
      expect(onValueChange.mock.calls[1][0]).toEqual(['two', 'one']);
    });

    it('`multiple` is false', async () => {
      const onValueChange = vi.fn();

      const { user } = await render(
        <Accordion.Root onValueChange={onValueChange} multiple={false}>
          <Accordion.Item value="one">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="two">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>,
      );

      const [trigger1, trigger2] = screen.getAllByRole('button');

      expect(onValueChange.mock.calls.length).toBe(0);

      await user.pointer({ keys: '[MouseLeft]', target: trigger1 });

      expect(onValueChange.mock.calls.length).toBe(1);
      expect(onValueChange.mock.calls[0][0]).toEqual(['one']);

      await user.pointer({ keys: '[MouseLeft]', target: trigger2 });

      expect(onValueChange.mock.calls.length).toBe(2);
      expect(onValueChange.mock.calls[1][0]).toEqual(['two']);
    });
  });
});
