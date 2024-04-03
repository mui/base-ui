import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { act, createRenderer, fireEvent, screen } from '@mui/internal-test-utils';
import { Tabs, TabsProps } from '@base_ui/react/Tabs';
import { describeConformance } from '../../test/describeConformance';

describe('<Tabs />', () => {
  const { render } = createRenderer();

  before(function beforeHook() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // The test fails on Safari with just:
    //
    // container.scrollLeft = 200;
    // expect(container.scrollLeft).to.equal(200); 💥
    if (isSafari) {
      this.skip();
    }
  });

  describeConformance(<Tabs value={0} />, () => ({
    inheritComponent: 'div',
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describe('prop: children', () => {
    it('should accept a null child', () => {
      const { getAllByRole } = render(
        <Tabs value={0}>
          {null}
          <Tabs.List>
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs>,
      );
      expect(getAllByRole('tab')).to.have.lengthOf(1);
    });

    it('should support empty children', () => {
      render(<Tabs value={1} />);
    });

    it('puts the selected child in tab order', () => {
      const { getAllByRole, setProps } = render(
        <Tabs value={1}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs>,
      );

      expect(getAllByRole('tab').map((tab) => tab.tabIndex)).to.have.ordered.members([-1, 0]);

      setProps({ value: 0 });

      expect(getAllByRole('tab').map((tab) => tab.tabIndex)).to.have.ordered.members([0, -1]);
    });

    it('sets the aria-labelledby attribute on tab panels to the corresponding tab id', () => {
      const { getAllByRole } = render(
        <Tabs defaultValue="tab-0">
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
        </Tabs>,
      );

      const tabs = getAllByRole('tab');
      const tabPanels = getAllByRole('tabpanel', { hidden: true });

      expect(tabPanels[0]).to.have.attribute('aria-labelledby', tabs[1].id);
      expect(tabPanels[1]).to.have.attribute('aria-labelledby', tabs[0].id);
      expect(tabPanels[2]).to.have.attribute('aria-labelledby', tabs[2].id);
      expect(tabPanels[3]).to.have.attribute('aria-labelledby', tabs[3].id);
    });

    it('sets the aria-controls attribute on tabs to the corresponding tab panel id', () => {
      const { getAllByRole } = render(
        <Tabs defaultValue="tab-0">
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
        </Tabs>,
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
    const tabs = (
      <Tabs value={1}>
        <Tabs.List>
          <Tabs.Tab value={0} />
          <Tabs.Tab value={1} />
        </Tabs.List>
      </Tabs>
    );

    it('should pass selected prop to children', () => {
      const { getAllByRole } = render(tabs);
      const tabElements = getAllByRole('tab');
      expect(tabElements[0]).to.have.attribute('aria-selected', 'false');
      expect(tabElements[1]).to.have.attribute('aria-selected', 'true');
    });
  });

  describe('prop: onChange', () => {
    it('should call onChange when clicking', () => {
      const handleChange = spy();
      const { getAllByRole } = render(
        <Tabs value={0} onChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs>,
      );

      fireEvent.click(getAllByRole('tab')[1]);
      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.args[0][1]).to.equal(1);
    });

    it('should not call onChange when already selected', () => {
      const handleChange = spy();
      const { getAllByRole } = render(
        <Tabs value={0} onChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs>,
      );

      fireEvent.click(getAllByRole('tab')[0]);
      expect(handleChange.callCount).to.equal(0);
    });

    it('should call onChange if an unselected tab gets focused', () => {
      const handleChange = spy();
      const { getAllByRole } = render(
        <Tabs value={0} onChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs>,
      );
      const [firstTab] = getAllByRole('tab');

      act(() => {
        firstTab.focus();
      });

      fireEvent.keyDown(firstTab, { key: 'ArrowRight' });

      expect(handleChange.callCount).to.equal(1);
      expect(handleChange.firstCall.args[1]).to.equal(1);
    });

    it('when `activateOnFocus = false` should not call onChange if an unselected tab gets focused', () => {
      const handleChange = spy();
      const { getAllByRole } = render(
        <Tabs value={1} onChange={handleChange}>
          <Tabs.List activateOnFocus={false}>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs>,
      );

      const [firstTab] = getAllByRole('tab');

      act(() => {
        firstTab.focus();
      });

      expect(handleChange.callCount).to.equal(0);
    });
  });

  describe('prop: orientation', () => {
    it('does not add aria-orientation by default', () => {
      render(
        <Tabs value={0}>
          <Tabs.List>
            <Tabs />
          </Tabs.List>
        </Tabs>,
      );

      expect(screen.getByRole('tablist')).not.to.have.attribute('aria-orientation');
    });

    it('adds the proper aria-orientation when vertical', () => {
      render(
        <Tabs value={0} orientation="vertical">
          <Tabs.List>
            <Tabs />
          </Tabs.List>
        </Tabs>,
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

      describe(`when focus is on a tab element in a ${orientation} ${direction} tablist`, () => {
        describe(previousItemKey ?? '', () => {
          describe('with `activateOnFocus = false`', () => {
            it('moves focus to the last tab without activating it if focus is on the first tab', () => {
              const handleChange = spy();
              const handleKeyDown = spy();
              const { getAllByRole } = render(
                <Tabs
                  direction={direction as TabsProps['direction']}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  orientation={orientation as TabsProps['orientation']}
                  value={0}
                >
                  <Tabs.List activateOnFocus={false}>
                    <Tabs.Tab value={0} />
                    <Tabs.Tab value={1} />
                    <Tabs.Tab value={2} />
                  </Tabs.List>
                </Tabs>,
              );
              const [firstTab, , lastTab] = getAllByRole('tab');
              act(() => {
                firstTab.focus();
              });

              fireEvent.keyDown(firstTab, { key: previousItemKey });

              expect(lastTab).toHaveFocus();
              expect(handleChange.callCount).to.equal(0);
              expect(handleKeyDown.callCount).to.equal(1);
              expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
            });

            it('moves focus to the previous tab without activating it', () => {
              const handleChange = spy();
              const handleKeyDown = spy();
              const { getAllByRole } = render(
                <Tabs
                  direction={direction as TabsProps['direction']}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  orientation={orientation as TabsProps['orientation']}
                  value={1}
                >
                  <Tabs.List activateOnFocus={false}>
                    <Tabs.Tab value={0} />
                    <Tabs.Tab value={1} />
                    <Tabs.Tab value={2} />
                  </Tabs.List>
                </Tabs>,
              );
              const [firstTab, secondTab] = getAllByRole('tab');
              act(() => {
                secondTab.focus();
              });

              fireEvent.keyDown(secondTab, { key: previousItemKey });

              expect(firstTab).toHaveFocus();
              expect(handleChange.callCount).to.equal(0);
              expect(handleKeyDown.callCount).to.equal(1);
              expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
            });
          });

          describe('with `activateOnFocus = true`', () => {
            it('moves focus to the last tab while activating it if focus is on the first tab', () => {
              const handleChange = spy();
              const handleKeyDown = spy();
              const { getAllByRole } = render(
                <Tabs
                  direction={direction as TabsProps['direction']}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  orientation={orientation as TabsProps['orientation']}
                  value={0}
                >
                  <Tabs.List>
                    <Tabs.Tab value={0} />
                    <Tabs.Tab value={1} />
                    <Tabs.Tab value={2} />
                  </Tabs.List>
                </Tabs>,
              );
              const [firstTab, , lastTab] = getAllByRole('tab');
              act(() => {
                firstTab.focus();
              });

              fireEvent.keyDown(firstTab, { key: previousItemKey });

              expect(lastTab).toHaveFocus();
              expect(handleChange.callCount).to.equal(1);
              expect(handleChange.firstCall.args[1]).to.equal(2);
              expect(handleKeyDown.callCount).to.equal(1);
              expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
            });

            it('moves focus to the previous tab while activating it', () => {
              const handleChange = spy();
              const handleKeyDown = spy();
              const { getAllByRole } = render(
                <Tabs
                  direction={direction as TabsProps['direction']}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  orientation={orientation as TabsProps['orientation']}
                  value={1}
                >
                  <Tabs.List>
                    <Tabs.Tab value={0} />
                    <Tabs.Tab value={1} />
                    <Tabs.Tab value={2} />
                  </Tabs.List>
                </Tabs>,
              );
              const [firstTab, secondTab] = getAllByRole('tab');
              act(() => {
                secondTab.focus();
              });

              fireEvent.keyDown(secondTab, { key: previousItemKey });

              expect(firstTab).toHaveFocus();
              expect(handleChange.callCount).to.equal(1);
              expect(handleChange.firstCall.args[1]).to.equal(0);
              expect(handleKeyDown.callCount).to.equal(1);
              expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
            });
          });

          it('skips over disabled tabs', () => {
            const handleKeyDown = spy();
            const { getAllByRole } = render(
              <Tabs
                direction={direction as TabsProps['direction']}
                onKeyDown={handleKeyDown}
                orientation={orientation as TabsProps['orientation']}
                value={2}
              >
                <Tabs.List>
                  <Tabs.Tab value={0} />
                  <Tabs.Tab value={1} disabled />
                  <Tabs.Tab value={2} />
                </Tabs.List>
              </Tabs>,
            );
            const [firstTab, , lastTab] = getAllByRole('tab');
            act(() => {
              lastTab.focus();
            });

            fireEvent.keyDown(lastTab, { key: previousItemKey });

            expect(firstTab).toHaveFocus();
            expect(handleKeyDown.callCount).to.equal(1);
            expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
          });
        });

        describe(nextItemKey ?? '', () => {
          describe('with `activateOnFocus = false`', () => {
            it('moves focus to the first tab without activating it if focus is on the last tab', () => {
              const handleChange = spy();
              const handleKeyDown = spy();
              const { getAllByRole } = render(
                <Tabs
                  direction={direction as TabsProps['direction']}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  orientation={orientation as TabsProps['orientation']}
                  value={2}
                >
                  <Tabs.List activateOnFocus={false}>
                    <Tabs.Tab value={0} />
                    <Tabs.Tab value={1} />
                    <Tabs.Tab value={2} />
                  </Tabs.List>
                </Tabs>,
              );
              const [firstTab, , lastTab] = getAllByRole('tab');
              act(() => {
                lastTab.focus();
              });

              fireEvent.keyDown(lastTab, { key: nextItemKey });

              expect(firstTab).toHaveFocus();
              expect(handleChange.callCount).to.equal(0);
              expect(handleKeyDown.callCount).to.equal(1);
              expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
            });

            it('moves focus to the next tab without activating it', () => {
              const handleChange = spy();
              const handleKeyDown = spy();
              const { getAllByRole } = render(
                <Tabs
                  direction={direction as TabsProps['direction']}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  orientation={orientation as TabsProps['orientation']}
                  value={1}
                >
                  <Tabs.List activateOnFocus={false}>
                    <Tabs.Tab value={0} />
                    <Tabs.Tab value={1} />
                    <Tabs.Tab value={2} />
                  </Tabs.List>
                </Tabs>,
              );
              const [, secondTab, lastTab] = getAllByRole('tab');
              act(() => {
                secondTab.focus();
              });

              fireEvent.keyDown(secondTab, { key: nextItemKey });

              expect(lastTab).toHaveFocus();
              expect(handleChange.callCount).to.equal(0);
              expect(handleKeyDown.callCount).to.equal(1);
              expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
            });
          });

          describe('with `activateOnFocus = true`', () => {
            it('moves focus to the first tab while activating it if focus is on the last tab', () => {
              const handleChange = spy();
              const handleKeyDown = spy();
              const { getAllByRole } = render(
                <Tabs
                  direction={direction as TabsProps['direction']}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  orientation={orientation as TabsProps['orientation']}
                  value={2}
                >
                  <Tabs.List>
                    <Tabs.Tab value={0} />
                    <Tabs.Tab value={1} />
                    <Tabs.Tab value={2} />
                  </Tabs.List>
                </Tabs>,
              );
              const [firstTab, , lastTab] = getAllByRole('tab');
              act(() => {
                lastTab.focus();
              });

              fireEvent.keyDown(lastTab, { key: nextItemKey });

              expect(firstTab).toHaveFocus();
              expect(handleChange.callCount).to.equal(1);
              expect(handleChange.firstCall.args[1]).to.equal(0);
              expect(handleKeyDown.callCount).to.equal(1);
              expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
            });

            it('moves focus to the next tab while activating it', () => {
              const handleChange = spy();
              const handleKeyDown = spy();
              const { getAllByRole } = render(
                <Tabs
                  direction={direction as TabsProps['direction']}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  orientation={orientation as TabsProps['orientation']}
                  value={1}
                >
                  <Tabs.List>
                    <Tabs.Tab value={0} />
                    <Tabs.Tab value={1} />
                    <Tabs.Tab value={2} />
                  </Tabs.List>
                </Tabs>,
              );
              const [, secondTab, lastTab] = getAllByRole('tab');
              act(() => {
                secondTab.focus();
              });

              fireEvent.keyDown(secondTab, { key: nextItemKey });

              expect(lastTab).toHaveFocus();
              expect(handleChange.callCount).to.equal(1);
              expect(handleChange.firstCall.args[1]).to.equal(2);
              expect(handleKeyDown.callCount).to.equal(1);
              expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
            });
          });

          it('skips over disabled tabs', () => {
            const handleKeyDown = spy();
            const { getAllByRole } = render(
              <Tabs
                direction={direction as TabsProps['direction']}
                onKeyDown={handleKeyDown}
                orientation={orientation as TabsProps['orientation']}
                value={0}
              >
                <Tabs.List>
                  <Tabs.Tab value={0} />
                  <Tabs.Tab value={1} disabled />
                  <Tabs.Tab value={2} />
                </Tabs.List>
              </Tabs>,
            );
            const [firstTab, , lastTab] = getAllByRole('tab');
            act(() => {
              firstTab.focus();
            });

            fireEvent.keyDown(firstTab, { key: nextItemKey });

            expect(lastTab).toHaveFocus();
            expect(handleKeyDown.callCount).to.equal(1);
            expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
          });
        });
      });
    });

    describe('when focus is on a tab regardless of orientation', () => {
      describe('Home', () => {
        it('when `activateOnFocus = false`, moves focus to the first tab without activating it', () => {
          const handleChange = spy();
          const handleKeyDown = spy();
          const { getAllByRole } = render(
            <Tabs onChange={handleChange} onKeyDown={handleKeyDown} value={2}>
              <Tabs.List activateOnFocus={false}>
                <Tabs.Tab value={0} />
                <Tabs.Tab value={1} />
                <Tabs.Tab value={2} />
              </Tabs.List>
            </Tabs>,
          );
          const [firstTab, , lastTab] = getAllByRole('tab');
          act(() => {
            lastTab.focus();
          });

          fireEvent.keyDown(lastTab, { key: 'Home' });

          expect(firstTab).toHaveFocus();
          expect(handleChange.callCount).to.equal(0);
          expect(handleKeyDown.callCount).to.equal(1);
          expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
        });

        it('when `activateOnFocus = true`, moves focus to the first tab while activating it', () => {
          const handleChange = spy();
          const handleKeyDown = spy();
          const { getAllByRole } = render(
            <Tabs onChange={handleChange} onKeyDown={handleKeyDown} value={2}>
              <Tabs.List>
                <Tabs.Tab value={0} />
                <Tabs.Tab value={1} />
                <Tabs.Tab value={2} />
              </Tabs.List>
            </Tabs>,
          );
          const [firstTab, , lastTab] = getAllByRole('tab');
          act(() => {
            lastTab.focus();
          });

          fireEvent.keyDown(lastTab, { key: 'Home' });

          expect(firstTab).toHaveFocus();
          expect(handleChange.callCount).to.equal(1);
          expect(handleChange.firstCall.args[1]).to.equal(0);
          expect(handleKeyDown.callCount).to.equal(1);
          expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
        });

        it('moves focus to first non-disabled tab', () => {
          const handleKeyDown = spy();
          const { getAllByRole } = render(
            <Tabs onKeyDown={handleKeyDown} value={2}>
              <Tabs.List>
                <Tabs.Tab value={0} disabled />
                <Tabs.Tab value={1} />
                <Tabs.Tab value={2} />
              </Tabs.List>
            </Tabs>,
          );
          const [, secondTab, lastTab] = getAllByRole('tab');
          act(() => {
            lastTab.focus();
          });

          fireEvent.keyDown(lastTab, { key: 'Home' });

          expect(secondTab).toHaveFocus();
          expect(handleKeyDown.callCount).to.equal(1);
          expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
        });
      });

      describe('End', () => {
        it('when `activateOnFocus = false`, moves focus to the last tab without activating it', () => {
          const handleChange = spy();
          const handleKeyDown = spy();
          const { getAllByRole } = render(
            <Tabs onChange={handleChange} onKeyDown={handleKeyDown} value={0}>
              <Tabs.List activateOnFocus={false}>
                <Tabs.Tab value={0} />
                <Tabs.Tab value={1} />
                <Tabs.Tab value={2} />
              </Tabs.List>
            </Tabs>,
          );
          const [firstTab, , lastTab] = getAllByRole('tab');
          act(() => {
            firstTab.focus();
          });

          fireEvent.keyDown(firstTab, { key: 'End' });

          expect(lastTab).toHaveFocus();
          expect(handleChange.callCount).to.equal(0);
          expect(handleKeyDown.callCount).to.equal(1);
          expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
        });

        it('when `activateOnFocus = true`, moves focus to the last tab while activating it', () => {
          const handleChange = spy();
          const handleKeyDown = spy();
          const { getAllByRole } = render(
            <Tabs onChange={handleChange} onKeyDown={handleKeyDown} value={0}>
              <Tabs.List>
                <Tabs.Tab value={0} />
                <Tabs.Tab value={1} />
                <Tabs.Tab value={2} />
              </Tabs.List>
            </Tabs>,
          );
          const [firstTab, , lastTab] = getAllByRole('tab');
          act(() => {
            firstTab.focus();
          });

          fireEvent.keyDown(firstTab, { key: 'End' });

          expect(lastTab).toHaveFocus();
          expect(handleChange.callCount).to.equal(1);
          expect(handleChange.firstCall.args[1]).to.equal(2);
          expect(handleKeyDown.callCount).to.equal(1);
          expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
        });

        it('moves focus to first non-disabled tab', () => {
          const handleKeyDown = spy();
          const { getAllByRole } = render(
            <Tabs onKeyDown={handleKeyDown} value={0}>
              <Tabs.List>
                <Tabs.Tab value={0} />
                <Tabs.Tab value={1} />
                <Tabs.Tab value={2} disabled />
              </Tabs.List>
            </Tabs>,
          );
          const [firstTab, secondTab] = getAllByRole('tab');
          act(() => {
            firstTab.focus();
          });

          fireEvent.keyDown(firstTab, { key: 'End' });

          expect(secondTab).toHaveFocus();
          expect(handleKeyDown.callCount).to.equal(1);
          expect(handleKeyDown.firstCall.args[0]).to.have.property('defaultPrevented', true);
        });
      });
    });

    it('should allow to focus first tab when there are no active tabs', () => {
      const { getAllByRole } = render(
        <Tabs defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs>,
      );

      expect(getAllByRole('tab').map((tab) => tab.getAttribute('tabIndex'))).to.deep.equal([
        '0',
        '-1',
      ]);
    });
  });
});
