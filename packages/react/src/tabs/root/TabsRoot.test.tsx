import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, describeSkipIf, flushMicrotasks, fireEvent, screen } from '@mui/internal-test-utils';
import {
  DirectionProvider,
  type TextDirection,
} from '@base-ui-components/react/direction-provider';
import { Tabs } from '@base-ui-components/react/tabs';
import { createRenderer, describeConformance } from '#test-utils';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

describe('<Tabs.Root />', () => {
  const { render } = createRenderer();

  before(function beforeHook() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // The test fails on Safari with just:
    //
    // container.scrollLeft = 200;
    // expect(container.scrollLeft).to.equal(200); 💥
    if (isSafari) {
      // @ts-expect-error to support mocha and vitest
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this?.skip?.() || t?.skip();
    }
  });

  describeConformance(<Tabs.Root value={0} />, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('prop: children', () => {
    it('should accept a null child', async () => {
      const { getAllByRole } = await render(
        <Tabs.Root value={0}>
          {null}
          <Tabs.List>
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>,
      );
      expect(getAllByRole('tab')).to.have.lengthOf(1);
    });

    it('should support empty children', async () => {
      await render(<Tabs.Root value={1} />);
    });

    it('puts the selected child in tab order', async () => {
      const { getAllByRole, setProps } = await render(
        <Tabs.Root value={1}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>,
      );

      expect(getAllByRole('tab').map((tab) => tab.tabIndex)).to.have.ordered.members([-1, 0]);

      setProps({ value: 0 });

      expect(getAllByRole('tab').map((tab) => tab.tabIndex)).to.have.ordered.members([0, -1]);
    });

    it('sets the aria-labelledby attribute on tab panels to the corresponding tab id', async () => {
      const { getAllByRole } = await render(
        <Tabs.Root defaultValue="tab-0">
          <Tabs.List>
            <Tabs.Tab value="tab-0" />
            <Tabs.Tab value="tab-1" id="explicit-tab-id-1" />
            <Tabs.Tab />
            <Tabs.Tab id="explicit-tab-id-3" />
          </Tabs.List>
          <Tabs.Panel value="tab-1" />
          <Tabs.Panel value="tab-0" />
          <Tabs.Panel />
          <Tabs.Panel />
        </Tabs.Root>,
      );

      const tabs = getAllByRole('tab');
      const tabPanels = getAllByRole('tabpanel', { hidden: true });

      expect(tabPanels[0]).to.have.attribute('aria-labelledby', tabs[1].id);
      expect(tabPanels[1]).to.have.attribute('aria-labelledby', tabs[0].id);
      expect(tabPanels[2]).to.have.attribute('aria-labelledby', tabs[2].id);
      expect(tabPanels[3]).to.have.attribute('aria-labelledby', tabs[3].id);
    });

    it('sets the aria-controls attribute on tabs to the corresponding tab panel id', async () => {
      const { getAllByRole } = await render(
        <Tabs.Root defaultValue="tab-0">
          <Tabs.List>
            <Tabs.Tab value="tab-0" />
            <Tabs.Tab value="tab-1" id="explicit-tab-id-1" />
            <Tabs.Tab />
            <Tabs.Tab id="explicit-tab-id-3" />
          </Tabs.List>
          <Tabs.Panel value="tab-1" />
          <Tabs.Panel value="tab-0" />
          <Tabs.Panel />
          <Tabs.Panel />
        </Tabs.Root>,
      );

      const tabs = getAllByRole('tab');
      const tabPanels = getAllByRole('tabpanel', { hidden: true });

      expect(tabs[0]).to.have.attribute('aria-controls', tabPanels[1].id);
      expect(tabs[1]).to.have.attribute('aria-controls', tabPanels[0].id);
      expect(tabs[2]).to.have.attribute('aria-controls', tabPanels[2].id);
      expect(tabs[3]).to.have.attribute('aria-controls', tabPanels[3].id);
    });
  });

  describe('prop: value', () => {
    it('should pass selected prop to children', async () => {
      const tabs = (
        <Tabs.Root value={1}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>
      );

      const { getAllByRole } = await render(tabs);
      const tabElements = getAllByRole('tab');
      expect(tabElements[0]).to.have.attribute('aria-selected', 'false');
      expect(tabElements[1]).to.have.attribute('aria-selected', 'true');
    });

    it('should support values of different types', async () => {
      const tabValues = [0, '1', { value: 2 }, () => 3, Symbol('4'), /5/];

      const { getAllByRole } = await render(
        <Tabs.Root>
          <Tabs.List>
            {tabValues.map((value, index) => (
              <Tabs.Tab key={index} value={value} />
            ))}
          </Tabs.List>
          {tabValues.map((value, index) => (
            <Tabs.Panel key={index} value={value} />
          ))}
        </Tabs.Root>,
      );

      const tabElements = getAllByRole('tab');
      const tabPanelElements = getAllByRole('tabpanel', { hidden: true });

      await Promise.allSettled(
        tabValues.map(async (value, index) => {
          expect(tabPanelElements[index]).to.have.attribute(
            'aria-labelledby',
            tabElements[index].id,
          );

          await act(() => {
            tabElements[index].click();
          });

          expect(tabPanelElements[index]).not.to.have.attribute('hidden');
        }),
      );
    });
  });

  describe('prop: onValueChange', () => {
    it('should call onValueChange when clicking', async () => {
      const handleChange = spy();
      const { getAllByRole } = await render(
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>,
      );

      fireEvent.click(getAllByRole('tab')[1]);
      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[0]).to.equal(1);
    });

    it('should not call onValueChange when already selected', async () => {
      const handleChange = spy();
      const { getAllByRole } = await render(
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>,
      );

      fireEvent.click(getAllByRole('tab')[0]);
      expect(handleChange.callCount).to.equal(0);
    });

    it('should call onValueChange if an unselected tab gets focused', async () => {
      const handleChange = spy();
      const { getAllByRole } = await render(
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>,
      );
      const [firstTab] = getAllByRole('tab');

      await act(async () => {
        firstTab.focus();
      });

      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
      await flushMicrotasks();

      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[0]).to.equal(1);
    });

    it('when `activateOnFocus = false` should not call onValueChange if an unselected tab gets focused', async () => {
      const handleChange = spy();
      const { getAllByRole } = await render(
        <Tabs.Root value={1} onValueChange={handleChange}>
          <Tabs.List activateOnFocus={false}>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>,
      );

      const [firstTab] = getAllByRole('tab');

      await act(async () => {
        firstTab.focus();
      });

      expect(handleChange.callCount).to.equal(0);
    });
  });

  describe('prop: orientation', () => {
    it('does not add aria-orientation by default', async () => {
      await render(
        <Tabs.Root value={0}>
          <Tabs.List>
            <Tabs.Root />
          </Tabs.List>
        </Tabs.Root>,
      );

      expect(screen.getByRole('tablist')).not.to.have.attribute('aria-orientation');
    });

    it('adds the proper aria-orientation when vertical', async () => {
      await render(
        <Tabs.Root value={0} orientation="vertical">
          <Tabs.List>
            <Tabs.Root />
          </Tabs.List>
        </Tabs.Root>,
      );

      expect(screen.getByRole('tablist')).to.have.attribute('aria-orientation', 'vertical');
    });
  });

  describe('keyboard navigation when focus is on a tab', () => {
    [
      ['horizontal', 'ltr', 'ArrowLeft', 'ArrowRight'],
      ['horizontal', 'rtl', 'ArrowRight', 'ArrowLeft'],
      ['vertical', undefined, 'ArrowUp', 'ArrowDown'],
    ].forEach((entry) => {
      const [orientation, direction, previousItemKey, nextItemKey] = entry;

      describeSkipIf(isJSDOM && direction === 'rtl')(
        `when focus is on a tab element in a ${orientation} ${direction ?? ''} tablist`,
        () => {
          describe(previousItemKey ?? '', () => {
            describe('with `activateOnFocus = false`', () => {
              it('moves focus to the last tab without activating it if focus is on the first tab', async () => {
                const handleChange = spy();
                const handleKeyDown = spy();
                const { getAllByRole } = await render(
                  <DirectionProvider direction={direction as TextDirection}>
                    <Tabs.Root
                      onValueChange={handleChange}
                      onKeyDown={handleKeyDown}
                      orientation={orientation as Tabs.Root.Props['orientation']}
                      value={0}
                    >
                      <Tabs.List activateOnFocus={false}>
                        <Tabs.Tab value={0} />
                        <Tabs.Tab value={1} />
                        <Tabs.Tab value={2} />
                      </Tabs.List>
                    </Tabs.Root>
                  </DirectionProvider>,
                );
                const [firstTab, , lastTab] = getAllByRole('tab');
                await act(async () => {
                  firstTab.focus();
                });

                fireEvent.keyDown(firstTab, { key: previousItemKey });
                await flushMicrotasks();

                expect(lastTab).toHaveFocus();
                expect(handleChange.callCount).to.equal(0);
                expect(handleKeyDown.callCount).to.equal(1);
                expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
              });

              it('moves focus to the previous tab without activating it', async () => {
                const handleChange = spy();
                const handleKeyDown = spy();
                const { getAllByRole } = await render(
                  <DirectionProvider direction={direction as TextDirection}>
                    <Tabs.Root
                      onValueChange={handleChange}
                      onKeyDown={handleKeyDown}
                      orientation={orientation as Tabs.Root.Props['orientation']}
                      value={1}
                    >
                      <Tabs.List activateOnFocus={false}>
                        <Tabs.Tab value={0} />
                        <Tabs.Tab value={1} />
                        <Tabs.Tab value={2} />
                      </Tabs.List>
                    </Tabs.Root>
                  </DirectionProvider>,
                );
                const [firstTab, secondTab] = getAllByRole('tab');
                await act(async () => {
                  secondTab.focus();
                });

                fireEvent.keyDown(secondTab, { key: previousItemKey });
                await flushMicrotasks();

                expect(firstTab).toHaveFocus();
                expect(handleChange.callCount).to.equal(0);
                expect(handleKeyDown.callCount).to.equal(1);
                expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
              });
            });

            describe('with `activateOnFocus = true`', () => {
              it('moves focus to the last tab while activating it if focus is on the first tab', async () => {
                const handleChange = spy();
                const handleKeyDown = spy();
                const { getAllByRole } = await render(
                  <DirectionProvider direction={direction as TextDirection}>
                    <Tabs.Root
                      onValueChange={handleChange}
                      onKeyDown={handleKeyDown}
                      orientation={orientation as Tabs.Root.Props['orientation']}
                      value={0}
                    >
                      <Tabs.List>
                        <Tabs.Tab value={0} />
                        <Tabs.Tab value={1} />
                        <Tabs.Tab value={2} />
                      </Tabs.List>
                    </Tabs.Root>
                  </DirectionProvider>,
                );
                const [firstTab, , lastTab] = getAllByRole('tab');
                await act(async () => {
                  firstTab.focus();
                });

                fireEvent.keyDown(firstTab, { key: previousItemKey });
                await flushMicrotasks();

                expect(lastTab).toHaveFocus();
                expect(handleChange.callCount).to.equal(1);
                expect(handleChange.firstCall.args[0]).to.equal(2);
                expect(handleKeyDown.callCount).to.equal(1);
                expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
              });

              it('moves focus to the previous tab while activating it', async () => {
                const handleChange = spy();
                const handleKeyDown = spy();
                const { getAllByRole } = await render(
                  <DirectionProvider direction={direction as TextDirection}>
                    <Tabs.Root
                      onValueChange={handleChange}
                      onKeyDown={handleKeyDown}
                      orientation={orientation as Tabs.Root.Props['orientation']}
                      value={1}
                    >
                      <Tabs.List>
                        <Tabs.Tab value={0} />
                        <Tabs.Tab value={1} />
                        <Tabs.Tab value={2} />
                      </Tabs.List>
                    </Tabs.Root>
                  </DirectionProvider>,
                );
                const [firstTab, secondTab] = getAllByRole('tab');
                await act(async () => {
                  secondTab.focus();
                });

                fireEvent.keyDown(secondTab, { key: previousItemKey });
                await flushMicrotasks();

                expect(firstTab).toHaveFocus();
                expect(handleChange.callCount).to.equal(1);
                expect(handleChange.firstCall.args[0]).to.equal(0);
                expect(handleKeyDown.callCount).to.equal(1);
                expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
              });
            });

            it('skips over disabled tabs', async () => {
              const handleKeyDown = spy();
              const { getAllByRole } = await render(
                <DirectionProvider direction={direction as TextDirection}>
                  <Tabs.Root
                    onKeyDown={handleKeyDown}
                    orientation={orientation as Tabs.Root.Props['orientation']}
                    value={2}
                  >
                    <Tabs.List>
                      <Tabs.Tab value={0} />
                      <Tabs.Tab value={1} disabled />
                      <Tabs.Tab value={2} />
                    </Tabs.List>
                  </Tabs.Root>
                </DirectionProvider>,
              );
              const [firstTab, , lastTab] = getAllByRole('tab');
              await act(async () => {
                lastTab.focus();
              });

              fireEvent.keyDown(lastTab, { key: previousItemKey });
              await flushMicrotasks();

              expect(firstTab).toHaveFocus();
              expect(handleKeyDown.callCount).to.equal(1);
              expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
            });
          });

          describe(nextItemKey ?? '', () => {
            describe('with `activateOnFocus = false`', () => {
              it('moves focus to the first tab without activating it if focus is on the last tab', async () => {
                const handleChange = spy();
                const handleKeyDown = spy();
                const { getAllByRole } = await render(
                  <DirectionProvider direction={direction as TextDirection}>
                    <Tabs.Root
                      onValueChange={handleChange}
                      onKeyDown={handleKeyDown}
                      orientation={orientation as Tabs.Root.Props['orientation']}
                      value={2}
                    >
                      <Tabs.List activateOnFocus={false}>
                        <Tabs.Tab value={0} />
                        <Tabs.Tab value={1} />
                        <Tabs.Tab value={2} />
                      </Tabs.List>
                    </Tabs.Root>
                  </DirectionProvider>,
                );
                const [firstTab, , lastTab] = getAllByRole('tab');
                await act(async () => {
                  lastTab.focus();
                });

                fireEvent.keyDown(lastTab, { key: nextItemKey });
                await flushMicrotasks();

                expect(firstTab).toHaveFocus();
                expect(handleChange.callCount).to.equal(0);
                expect(handleKeyDown.callCount).to.equal(1);
                expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
              });

              it('moves focus to the next tab without activating it', async () => {
                const handleChange = spy();
                const handleKeyDown = spy();
                const { getAllByRole } = await render(
                  <DirectionProvider direction={direction as TextDirection}>
                    <Tabs.Root
                      onValueChange={handleChange}
                      onKeyDown={handleKeyDown}
                      orientation={orientation as Tabs.Root.Props['orientation']}
                      value={1}
                    >
                      <Tabs.List activateOnFocus={false}>
                        <Tabs.Tab value={0} />
                        <Tabs.Tab value={1} />
                        <Tabs.Tab value={2} />
                      </Tabs.List>
                    </Tabs.Root>
                  </DirectionProvider>,
                );
                const [, secondTab, lastTab] = getAllByRole('tab');
                await act(async () => {
                  secondTab.focus();
                });

                fireEvent.keyDown(secondTab, { key: nextItemKey });
                await flushMicrotasks();

                expect(lastTab).toHaveFocus();
                expect(handleChange.callCount).to.equal(0);
                expect(handleKeyDown.callCount).to.equal(1);
                expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
              });
            });

            describe('with `activateOnFocus = true`', () => {
              it('moves focus to the first tab while activating it if focus is on the last tab', async () => {
                const handleChange = spy();
                const handleKeyDown = spy();
                const { getAllByRole } = await render(
                  <DirectionProvider direction={direction as TextDirection}>
                    <Tabs.Root
                      onValueChange={handleChange}
                      onKeyDown={handleKeyDown}
                      orientation={orientation as Tabs.Root.Props['orientation']}
                      value={2}
                    >
                      <Tabs.List>
                        <Tabs.Tab value={0} />
                        <Tabs.Tab value={1} />
                        <Tabs.Tab value={2} />
                      </Tabs.List>
                    </Tabs.Root>
                  </DirectionProvider>,
                );
                const [firstTab, , lastTab] = getAllByRole('tab');
                await act(async () => {
                  lastTab.focus();
                });

                fireEvent.keyDown(lastTab, { key: nextItemKey });
                await flushMicrotasks();

                expect(firstTab).toHaveFocus();
                expect(handleChange.callCount).to.equal(1);
                expect(handleChange.firstCall.args[0]).to.equal(0);
                expect(handleKeyDown.callCount).to.equal(1);
                expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
              });

              it('moves focus to the next tab while activating it', async () => {
                const handleChange = spy();
                const handleKeyDown = spy();
                const { getAllByRole } = await render(
                  <DirectionProvider direction={direction as TextDirection}>
                    <Tabs.Root
                      onValueChange={handleChange}
                      onKeyDown={handleKeyDown}
                      orientation={orientation as Tabs.Root.Props['orientation']}
                      value={1}
                    >
                      <Tabs.List>
                        <Tabs.Tab value={0} />
                        <Tabs.Tab value={1} />
                        <Tabs.Tab value={2} />
                      </Tabs.List>
                    </Tabs.Root>
                  </DirectionProvider>,
                );
                const [, secondTab, lastTab] = getAllByRole('tab');
                await act(async () => {
                  secondTab.focus();
                });

                fireEvent.keyDown(secondTab, { key: nextItemKey });
                await flushMicrotasks();

                expect(lastTab).toHaveFocus();
                expect(handleChange.callCount).to.equal(1);
                expect(handleChange.firstCall.args[0]).to.equal(2);
                expect(handleKeyDown.callCount).to.equal(1);
                expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
              });
            });

            it('skips over disabled tabs', async () => {
              const handleKeyDown = spy();
              const { getAllByRole } = await render(
                <DirectionProvider direction={direction as TextDirection}>
                  <Tabs.Root
                    onKeyDown={handleKeyDown}
                    orientation={orientation as Tabs.Root.Props['orientation']}
                    value={0}
                  >
                    <Tabs.List>
                      <Tabs.Tab value={0} />
                      <Tabs.Tab value={1} disabled />
                      <Tabs.Tab value={2} />
                    </Tabs.List>
                  </Tabs.Root>
                </DirectionProvider>,
              );
              const [firstTab, , lastTab] = getAllByRole('tab');
              await act(async () => {
                firstTab.focus();
              });

              fireEvent.keyDown(firstTab, { key: nextItemKey });
              await flushMicrotasks();

              expect(lastTab).toHaveFocus();
              expect(handleKeyDown.callCount).to.equal(1);
              expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
            });
          });
        },
      );
    });

    describe('when focus is on a tab regardless of orientation', () => {
      describe('Home', () => {
        it('when `activateOnFocus = false`, moves focus to the first tab without activating it', async () => {
          const handleChange = spy();
          const handleKeyDown = spy();
          const { getAllByRole } = await render(
            <Tabs.Root onValueChange={handleChange} onKeyDown={handleKeyDown} value={2}>
              <Tabs.List activateOnFocus={false}>
                <Tabs.Tab value={0} />
                <Tabs.Tab value={1} />
                <Tabs.Tab value={2} />
              </Tabs.List>
            </Tabs.Root>,
          );
          const [firstTab, , lastTab] = getAllByRole('tab');
          await act(async () => {
            lastTab.focus();
          });

          fireEvent.keyDown(lastTab, { key: 'Home' });
          await flushMicrotasks();

          expect(firstTab).toHaveFocus();
          expect(handleChange.callCount).to.equal(0);
          expect(handleKeyDown.callCount).to.equal(1);
          expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
        });

        it('when `activateOnFocus = true`, moves focus to the first tab while activating it', async () => {
          const handleChange = spy();
          const handleKeyDown = spy();
          const { getAllByRole } = await render(
            <Tabs.Root onValueChange={handleChange} onKeyDown={handleKeyDown} value={2}>
              <Tabs.List>
                <Tabs.Tab value={0} />
                <Tabs.Tab value={1} />
                <Tabs.Tab value={2} />
              </Tabs.List>
            </Tabs.Root>,
          );
          const [firstTab, , lastTab] = getAllByRole('tab');
          await act(async () => {
            lastTab.focus();
          });

          fireEvent.keyDown(lastTab, { key: 'Home' });
          await flushMicrotasks();

          expect(firstTab).toHaveFocus();
          expect(handleChange.callCount).to.equal(1);
          expect(handleChange.firstCall.args[0]).to.equal(0);
          expect(handleKeyDown.callCount).to.equal(1);
          expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
        });

        it('moves focus to first non-disabled tab', async () => {
          const handleKeyDown = spy();
          const { getAllByRole } = await render(
            <Tabs.Root onKeyDown={handleKeyDown} value={2}>
              <Tabs.List>
                <Tabs.Tab value={0} disabled />
                <Tabs.Tab value={1} />
                <Tabs.Tab value={2} />
              </Tabs.List>
            </Tabs.Root>,
          );
          const [, secondTab, lastTab] = getAllByRole('tab');
          await act(async () => {
            lastTab.focus();
          });

          fireEvent.keyDown(lastTab, { key: 'Home' });
          await flushMicrotasks();

          expect(secondTab).toHaveFocus();
          expect(handleKeyDown.callCount).to.equal(1);
          expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
        });
      });

      describe('End', () => {
        it('when `activateOnFocus = false`, moves focus to the last tab without activating it', async () => {
          const handleChange = spy();
          const handleKeyDown = spy();
          const { getAllByRole } = await render(
            <Tabs.Root onValueChange={handleChange} onKeyDown={handleKeyDown} value={0}>
              <Tabs.List activateOnFocus={false}>
                <Tabs.Tab value={0} />
                <Tabs.Tab value={1} />
                <Tabs.Tab value={2} />
              </Tabs.List>
            </Tabs.Root>,
          );
          const [firstTab, , lastTab] = getAllByRole('tab');
          await act(async () => {
            firstTab.focus();
          });

          fireEvent.keyDown(firstTab, { key: 'End' });
          await flushMicrotasks();

          expect(lastTab).toHaveFocus();
          expect(handleChange.callCount).to.equal(0);
          expect(handleKeyDown.callCount).to.equal(1);
          expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
        });

        it('when `activateOnFocus = true`, moves focus to the last tab while activating it', async () => {
          const handleChange = spy();
          const handleKeyDown = spy();
          const { getAllByRole } = await render(
            <Tabs.Root onValueChange={handleChange} onKeyDown={handleKeyDown} value={0}>
              <Tabs.List>
                <Tabs.Tab value={0} />
                <Tabs.Tab value={1} />
                <Tabs.Tab value={2} />
              </Tabs.List>
            </Tabs.Root>,
          );
          const [firstTab, , lastTab] = getAllByRole('tab');
          await act(async () => {
            firstTab.focus();
          });

          fireEvent.keyDown(firstTab, { key: 'End' });
          await flushMicrotasks();

          expect(lastTab).toHaveFocus();
          expect(handleChange.callCount).to.equal(1);
          expect(handleChange.firstCall.args[0]).to.equal(2);
          expect(handleKeyDown.callCount).to.equal(1);
          expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
        });

        it('moves focus to first non-disabled tab', async () => {
          const handleKeyDown = spy();
          const { getAllByRole } = await render(
            <Tabs.Root onKeyDown={handleKeyDown} value={0}>
              <Tabs.List>
                <Tabs.Tab value={0} />
                <Tabs.Tab value={1} />
                <Tabs.Tab value={2} disabled />
              </Tabs.List>
            </Tabs.Root>,
          );
          const [firstTab, secondTab] = getAllByRole('tab');
          await act(async () => {
            firstTab.focus();
          });

          fireEvent.keyDown(firstTab, { key: 'End' });
          await flushMicrotasks();

          expect(secondTab).toHaveFocus();
          expect(handleKeyDown.callCount).to.equal(1);
          expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
        });
      });
    });

    it('should allow to focus first tab when there are no active tabs', async () => {
      const { getAllByRole } = await render(
        <Tabs.Root defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>,
      );

      expect(getAllByRole('tab').map((tab) => tab.getAttribute('tabIndex'))).to.deep.equal([
        '0',
        '-1',
      ]);
    });
  });

  describeSkipIf(isJSDOM)('activation direction', () => {
    it('should set the `data-activation-direction` attribute on the tabs root with orientation=horizontal', async () => {
      const { getAllByRole, getByTestId } = await render(
        <Tabs.Root data-testid="root">
          <Tabs.List>
            <Tabs.Tab />
            <Tabs.Tab />
          </Tabs.List>
        </Tabs.Root>,
      );

      const root = getByTestId('root');
      const [tab1, tab2] = getAllByRole('tab');

      expect(root).to.have.attribute('data-activation-direction', 'none');
      await act(async () => {
        tab2.click();
      });

      expect(root).to.have.attribute('data-activation-direction', 'right');

      await act(async () => {
        tab1.click();
      });

      expect(root).to.have.attribute('data-activation-direction', 'left');
    });

    it('should set the `data-activation-direction` attribute on the tabs root with orientation=vertical', async () => {
      const { getAllByRole, getByTestId } = await render(
        <Tabs.Root data-testid="root" orientation="vertical">
          <Tabs.List>
            <Tabs.Tab style={{ display: 'block' }} />
            <Tabs.Tab style={{ display: 'block' }} />
          </Tabs.List>
        </Tabs.Root>,
      );

      const root = getByTestId('root');
      const [tab1, tab2] = getAllByRole('tab');

      expect(root).to.have.attribute('data-activation-direction', 'none');
      await act(async () => {
        tab2.click();
      });

      expect(root).to.have.attribute('data-activation-direction', 'down');

      await act(async () => {
        tab1.click();
      });

      expect(root).to.have.attribute('data-activation-direction', 'up');
    });
  });
});
