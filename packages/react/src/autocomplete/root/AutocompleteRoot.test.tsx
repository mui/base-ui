import * as React from 'react';
import { act, fireEvent, flushMicrotasks, screen, waitFor } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { expect } from 'chai';
import { spy } from 'sinon';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';

describe('<Autocomplete.Root />', () => {
  beforeEach(() => {
    globalThis.BASE_UI_ANIMATIONS_DISABLED = true;
  });

  const { render } = createRenderer();

  describe('keyboard interactions', () => {
    it('closes popup on Tab after selecting with Enter and typing again', async () => {
      const { user } = await render(
        <Autocomplete.Root items={['alpha', 'alpine', 'beta']} autoHighlight>
          <Autocomplete.Input />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
          <button />
        </Autocomplete.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.click(input);
      await user.type(input, 'al');

      const firstOption = await screen.findByRole('option', { name: 'alpha' });
      expect(firstOption).to.have.attribute('data-highlighted');

      await user.keyboard('{Enter}');
      expect(input.value).to.equal('alpha');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });

      await user.clear(input);
      await user.type(input, 'a');

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.to.equal(null);
      });

      await user.tab();

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).to.equal(null);
      });
    });
  });

  it('should handle browser autofill', async () => {
    await render(
      <Field.Root name="auto">
        <Autocomplete.Root defaultValue="">
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  <Autocomplete.Item value="alpha">alpha</Autocomplete.Item>
                  <Autocomplete.Item value="beta">beta</Autocomplete.Item>
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>
      </Field.Root>,
    );

    // Hidden inputs are rendered without a name for selectionMode='none', but Field provides the form input.
    // Simulate browser autofill by changing the hidden field control input for this Field.
    const hidden = screen.getByRole('textbox', {
      hidden: true,
    });
    fireEvent.change(hidden!, { target: { value: 'beta' } });
    await flushMicrotasks();

    const input = screen.getByTestId<HTMLInputElement>('input');
    expect(input.value).to.equal('beta');
  });

  it('should pass autoComplete to the visible input', async () => {
    await render(
      <Autocomplete.Root name="search">
        <Autocomplete.Input autoComplete="on" />
        <Autocomplete.Portal>
          <Autocomplete.Positioner>
            <Autocomplete.Popup>
              <Autocomplete.List>
                <Autocomplete.Item value="alpha">alpha</Autocomplete.Item>
                <Autocomplete.Item value="beta">beta</Autocomplete.Item>
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>,
    );

    const input = screen.getByRole('combobox');
    const hiddenInput = screen.getByRole('textbox', { hidden: true });

    expect(input).to.have.attribute('name', 'search');
    expect(input).to.have.attribute('autocomplete', 'on');
    expect(hiddenInput).not.to.have.attribute('name');
    expect(hiddenInput).to.have.attribute('id');
    expect(hiddenInput).not.to.have.attribute('autocomplete');
  });

  describe('prop: autoHighlight', () => {
    it('calls onItemHighlighted when the popup auto highlights on open', async () => {
      const onItemHighlighted = spy();

      const { user } = await render(
        <Autocomplete.Root
          items={['alpha', 'alpine', 'beta']}
          autoHighlight
          onItemHighlighted={onItemHighlighted}
        >
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByTestId<HTMLInputElement>('input');
      await user.type(input, 'a');

      const firstOption = await screen.findByRole('option', { name: 'alpha' });
      expect(onItemHighlighted.callCount).to.be.greaterThan(0);

      const [value, eventDetails] = onItemHighlighted.lastCall.args;
      expect(value).to.equal('alpha');
      expect(eventDetails.reason).to.equal('none');

      await waitFor(() => {
        expect(firstOption).to.have.attribute('data-highlighted');
      });
    });

    it('highlights the first item when typing and keeps it during filtering', async () => {
      const { user } = await render(
        <Autocomplete.Root autoHighlight>
          <Autocomplete.Input />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  <Autocomplete.Item value="new york">new york</Autocomplete.Item>
                  <Autocomplete.Item value="new york city">new york city</Autocomplete.Item>
                  <Autocomplete.Item value="newcastle">newcastle</Autocomplete.Item>
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'new');

      const newYorkOption = screen.getByRole('option', { name: 'new york' });
      expect(newYorkOption).to.have.attribute('data-highlighted');
      expect(input.getAttribute('aria-activedescendant')).to.equal(newYorkOption.id);

      // Trailing space should not clear highlight if matches remain
      await user.type(input, ' ');

      expect(newYorkOption).to.have.attribute('data-highlighted');
      expect(input.getAttribute('aria-activedescendant')).to.equal(newYorkOption.id);
    });

    it('does not highlight on open via click or when pressing arrow keys initially', async () => {
      const { user } = await render(
        <Autocomplete.Root items={['apple', 'banana']} autoHighlight openOnInputClick>
          <Autocomplete.Input />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      fireEvent.click(input);

      await waitFor(() => {
        expect(input).not.to.have.attribute('aria-activedescendant');
      });

      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(input).not.to.have.attribute('aria-activedescendant');
      });

      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(input).not.to.have.attribute('aria-activedescendant');
      });

      await user.keyboard('{Escape}');
      await user.click(input);

      expect(input).not.to.have.attribute('aria-activedescendant');

      await user.keyboard('{ArrowUp}');
      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant');
      });
    });

    it('highlights the first item when opening via ArrowDown', async () => {
      const { user } = await render(
        <Autocomplete.Root items={['alpha', 'beta', 'gamma']} autoHighlight>
          <Autocomplete.Input />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.click(input);
      await user.keyboard('{ArrowDown}');

      const firstOption = await screen.findByRole('option', { name: 'alpha' });
      expect(firstOption).to.have.attribute('data-highlighted');
      expect(input.getAttribute('aria-activedescendant')).to.equal(firstOption.id);
    });

    it('links aria-activedescendant to the highlighted item after filtering', async () => {
      const { user } = await render(
        <Autocomplete.Root items={['feature', 'fix']} autoHighlight>
          <Autocomplete.Input />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      // Type 'f' — both items remain, first should be highlighted
      await user.type(input, 'f');
      const firstOption = screen.getByRole('option', { name: 'feature' });
      expect(firstOption).to.have.attribute('data-highlighted');
      expect(input.getAttribute('aria-activedescendant')).to.equal(firstOption.id);

      // Type 'i' — filters to "fix" and highlight should follow, with ids stable
      await user.type(input, 'i');
      const fixOption = screen.getByRole('option', { name: 'fix' });
      expect(fixOption).to.have.attribute('data-highlighted');
      expect(input.getAttribute('aria-activedescendant')).to.equal(fixOption.id);
    });

    it('does not highlight first/last item when pressing ArrowDown/ArrowUp initially', async () => {
      const { user } = await render(
        <Autocomplete.Root items={['alpha', 'beta', 'gamma']}>
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByTestId<HTMLInputElement>('input');

      await user.click(input);
      expect(input).not.to.have.attribute('aria-activedescendant');

      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(input).not.to.have.attribute('aria-activedescendant');
      });

      await user.keyboard('{ArrowDown}');
      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant');
      });
    });

    it('retains highlight when clearing the query with autoHighlight enabled', async () => {
      const { user } = await render(
        <Autocomplete.Root items={['apple', 'banana', 'cherry']} autoHighlight openOnInputClick>
          <Autocomplete.Input />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.click(input);
      await user.type(input, 'ban');

      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
      expect(input).to.have.attribute('aria-activedescendant');

      const highlightedBefore = input.getAttribute('aria-activedescendant');
      expect(highlightedBefore).to.not.equal(null);

      await user.clear(input);

      await waitFor(() => expect(screen.getByRole('listbox')).not.to.equal(null));
      expect(input.getAttribute('aria-activedescendant')).to.equal(highlightedBefore);
    });

    it('highlights the first item immediately when behavior is "always"', async () => {
      await render(
        <Autocomplete.Root items={['alpha', 'beta', 'gamma']} autoHighlight="always" defaultOpen>
          <Autocomplete.Input />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      const firstOption = screen.getByRole('option', { name: 'alpha' });

      expect(input).to.have.attribute('aria-activedescendant', firstOption.id);
      expect(firstOption).to.have.attribute('data-highlighted');
    });

    it('keeps the latest pointer highlight on outside blur when behavior is "always"', async () => {
      const { user } = await render(
        <React.Fragment>
          <Autocomplete.Root
            items={['apple', 'banana', 'cherry']}
            autoHighlight="always"
            keepHighlight
            open
            inline
          >
            <Autocomplete.Input data-testid="input" />
            <Autocomplete.List>
              {(item: string) => (
                <Autocomplete.Item key={item} value={item}>
                  {item}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Root>
          <button data-testid="outside">outside</button>
        </React.Fragment>,
      );

      const input = screen.getByTestId<HTMLInputElement>('input');
      const banana = screen.getByRole('option', { name: 'banana' });

      await act(async () => {
        input.focus();
      });

      await user.hover(banana);

      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', banana.id);
        expect(banana).to.have.attribute('data-highlighted');
      });

      const outside = screen.getByTestId('outside');
      fireEvent.pointerDown(outside);
      fireEvent.blur(input, { relatedTarget: outside });
      fireEvent.focus(outside);

      await waitFor(() => {
        expect(input).to.have.attribute('aria-activedescendant', banana.id);
        expect(banana).to.have.attribute('data-highlighted');
      });

      expect(screen.getByRole('option', { name: 'apple' })).not.to.have.attribute(
        'data-highlighted',
      );
    });
  });

  describe('prop: keepHighlight', () => {
    it('keeps the current highlight when the pointer leaves the list', async () => {
      const { user } = await render(
        <Autocomplete.Root items={['apple', 'banana']} autoHighlight keepHighlight>
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.click(input);
      await user.type(input, 'ap');

      const apple = await screen.findByRole('option', { name: 'apple' });
      await waitFor(() => expect(apple).to.have.attribute('data-highlighted'));

      const outside = document.createElement('div');
      document.body.appendChild(outside);
      fireEvent.pointerLeave(apple, { pointerType: 'mouse', relatedTarget: outside });

      await waitFor(() => expect(apple).to.have.attribute('data-highlighted'));
      outside.remove();
    });

    it('continues keyboard navigation from the kept highlight after pointer leave', async () => {
      const { user } = await render(
        <Autocomplete.Root items={['apple', 'banana', 'carrot']} autoHighlight keepHighlight>
          <Autocomplete.Input />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.click(input);
      await user.type(input, 'a');

      const apple = await screen.findByRole('option', { name: 'apple' });
      await waitFor(() => expect(apple).to.have.attribute('data-highlighted'));

      const outside = document.createElement('div');
      document.body.appendChild(outside);
      fireEvent.pointerLeave(apple, { pointerType: 'mouse', relatedTarget: outside });

      await user.keyboard('{ArrowDown}');

      const banana = screen.getByRole('option', { name: 'banana' });
      await waitFor(() => expect(banana).to.have.attribute('data-highlighted'));
      outside.remove();
    });
  });

  describe('prop: mode', () => {
    it('mode="list" (default): no inline overlay, consumer handles filtering', async () => {
      const items = ['apple', 'banana', 'cherry'];

      const { user } = await render(
        <Autocomplete.Root mode="list" items={items}>
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.click(input);
      await user.type(input, 'a');

      expect(screen.getAllByRole('option')).to.have.length(2); // apple, banana

      await user.keyboard('{ArrowDown}');

      expect(input.value).to.equal('a');
      expect(screen.getAllByRole('option')).to.have.length(2);
    });

    it('mode="both": inline overlay + autocomplete handles filtering', async () => {
      const items = ['apple', 'banana', 'cherry'];

      const { user } = await render(
        <Autocomplete.Root mode="both" items={items}>
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByTestId<HTMLInputElement>('input');

      await user.click(input);
      await user.type(input, 'a');

      expect(screen.getAllByRole('option')).to.have.length(2); // apple, banana

      await user.keyboard('{ArrowDown}');

      expect(input.value).to.equal('apple');
      expect(screen.getAllByRole('option')).to.have.length(2);
    });

    it('mode="both": hovering items should not change the inline overlay (preserve temporary value)', async () => {
      const items = ['alpha', 'alpine', 'beta'];

      const { user } = await render(
        <Autocomplete.Root mode="both" items={items}>
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item) => (
                    <Autocomplete.Item key={item} value={item}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.click(input);
      await user.type(input, 'al');

      await user.keyboard('{ArrowDown}');
      expect(input.value).to.equal('alpha');

      await user.hover(screen.getByRole('option', { name: 'alpine' }));
      expect(input.value).to.equal('alpha');
    });

    it('mode="inline": static items with inline overlay', async () => {
      const { user } = await render(
        <Autocomplete.Root mode="inline" openOnInputClick>
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  <Autocomplete.Item value="apple">apple</Autocomplete.Item>
                  <Autocomplete.Item value="banana">banana</Autocomplete.Item>
                  <Autocomplete.Item value="cherry">cherry</Autocomplete.Item>
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.click(input);

      await waitFor(() => {
        expect(screen.getAllByRole('option')).to.have.length(3);
      });

      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(input.value).to.equal('apple');
      });

      await user.type(input, 'b');

      expect(input.value).to.equal('appleb');
      expect(screen.getAllByRole('option')).to.have.length(3);
    });

    it('mode="none": static items without inline overlay', async () => {
      const { user } = await render(
        <Autocomplete.Root mode="none" openOnInputClick>
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  <Autocomplete.Item value="apple">apple</Autocomplete.Item>
                  <Autocomplete.Item value="banana">banana</Autocomplete.Item>
                  <Autocomplete.Item value="cherry">cherry</Autocomplete.Item>
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.click(input);
      await user.keyboard('{ArrowDown}');

      expect(input.value).to.equal('');
      expect(screen.getAllByRole('option')).to.have.length(3);

      await user.type(input, 'x');
      await user.keyboard('{ArrowDown}');

      expect(input.value).to.equal('x');
      expect(screen.getAllByRole('option')).to.have.length(3);
    });
  });

  describe('prop: filter', () => {
    it('does not apply default filtering when filter is null', async () => {
      interface Movie {
        id: string;
        title: string;
        year: number;
      }

      const asyncResults: Movie[] = [
        { id: '1', title: 'Pulp Fiction', year: 1994 },
        { id: '2', title: 'The Godfather', year: 1972 },
        { id: '3', title: 'The Dark Knight', year: 2008 },
      ];

      const { user } = await render(
        <Autocomplete.Root
          items={asyncResults}
          filter={null}
          itemToStringValue={(movie: Movie) => movie.title}
        >
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(movie: Movie) => (
                    <Autocomplete.Item key={movie.id} value={movie}>
                      {movie.title}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByTestId<HTMLInputElement>('input');
      await user.type(input, '1994');

      await waitFor(() => {
        expect(screen.getAllByRole('option')).to.have.length(3);
      });
      expect(screen.getByRole('option', { name: 'Pulp Fiction' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'The Godfather' })).not.to.equal(null);
      expect(screen.getByRole('option', { name: 'The Dark Knight' })).not.to.equal(null);
    });
  });

  describe('prop: submitOnItemClick', () => {
    it('prevents submit on Enter when an item is highlighted by default (false)', async () => {
      let submitted = 0;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        submitted += 1;
      };

      const { user } = await render(
        <form onSubmit={handleSubmit}>
          <Field.Root name="search">
            <Autocomplete.Root items={['apple', 'banana']} autoHighlight>
              <Autocomplete.Input />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List>
                      {(item) => (
                        <Autocomplete.Item key={item} value={item}>
                          {item}
                        </Autocomplete.Item>
                      )}
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </Field.Root>
        </form>,
      );

      const input = screen.getByRole('combobox');
      await user.click(screen.getByRole('combobox'));
      await user.type(input, 'a'); // open and highlight first
      await user.keyboard('{Enter}');

      expect(submitted).to.equal(0);
    });

    it('when true, clicking with pointer submits the owning form', async () => {
      let submitValue: string | null = null;
      let submitCount = 0;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        submitValue = (data.get('q') as string) ?? null;
        submitCount += 1;
      };

      const { user } = await render(
        <form onSubmit={handleSubmit}>
          <Field.Root name="q">
            <Autocomplete.Root items={['alpha', 'alpine']} submitOnItemClick>
              <Autocomplete.Input />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List>
                      {(item) => (
                        <Autocomplete.Item key={item} value={item}>
                          {item}
                        </Autocomplete.Item>
                      )}
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </Field.Root>
        </form>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.type(input, 'al');

      const alphaButton = screen.getByRole('option', { name: 'alpha' });
      await user.click(alphaButton);

      expect(submitValue).to.equal('alpha');
      expect(submitCount).to.equal(1);
    });

    it('when true, pressing Enter in the Input submits the owning form when an item is highlighted', async () => {
      let submitValue: string | null = null;
      let submitCount = 0;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        submitValue = (data.get('q') as string) ?? null;
        submitCount += 1;
      };

      const { user } = await render(
        <form onSubmit={handleSubmit}>
          <Field.Root name="q">
            <Autocomplete.Root items={['alpha', 'alpine']} submitOnItemClick>
              <Autocomplete.Input />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List>
                      {(item) => (
                        <Autocomplete.Item key={item} value={item}>
                          {item}
                        </Autocomplete.Item>
                      )}
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </Field.Root>
        </form>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.type(input, 'al');
      await user.keyboard('{ArrowDown}');

      const alphaButton = screen.getByRole('option', { name: 'alpha' });
      expect(alphaButton).to.have.attribute('data-highlighted');

      await user.keyboard('{Enter}');

      expect(submitValue).to.equal('alpha');
      expect(submitCount).to.equal(1);
    });

    it('focusing the listbox should keep the input focused and maintain functionality', async () => {
      let submitValue: string | null = null;
      let submitCount = 0;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        submitValue = (data.get('q') as string) ?? null;
        submitCount += 1;
      };

      const { user } = await render(
        <form onSubmit={handleSubmit}>
          <Field.Root name="q">
            <Autocomplete.Root items={['alpha', 'alpine']} submitOnItemClick>
              <Autocomplete.Input />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List data-testid="listbox">
                      {(item) => (
                        <Autocomplete.Item key={item} value={item}>
                          {item}
                        </Autocomplete.Item>
                      )}
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </Field.Root>
        </form>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.type(input, 'al');
      await user.keyboard('{ArrowDown}');

      const listbox = screen.getByRole('listbox');
      const alphaOption = screen.getByRole('option', { name: 'alpha' });
      await waitFor(() => {
        expect(alphaOption).to.have.attribute('data-highlighted');
      });

      await act(() => {
        listbox.focus();
      });
      expect(input).toHaveFocus();

      await user.keyboard('{Enter}');

      expect(submitValue).to.equal('alpha');
      expect(submitCount).to.equal(1);
    });
  });

  describe('Form', () => {
    const { render: renderFakeTimers, clock } = createRenderer({
      clockOptions: {
        shouldAdvanceTime: true,
      },
    });

    clock.withFakeTimers();

    it('submits the typed input value when wrapped in Field.Root', async () => {
      let submitted: string | null = null;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        submitted = (data.get('search') as string) ?? null;
      };

      const { user } = await render(
        <Form onSubmit={handleSubmit}>
          <Field.Root name="search">
            <Autocomplete.Root>
              <Autocomplete.Input data-testid="input" />
            </Autocomplete.Root>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const input = screen.getByTestId('input');
      await user.type(input, 'hello world');
      await user.click(screen.getByText('Submit'));

      expect(submitted).to.equal('hello world');
    });

    it('submits the typed input value when name is provided on Autocomplete.Root', async () => {
      let submitted: FormDataEntryValue | null = null;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        submitted = data.get('query');
      };

      const { user } = await render(
        <Form onSubmit={handleSubmit}>
          <Field.Root name="query">
            <Autocomplete.Root>
              <Autocomplete.Input data-testid="input" />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List>
                      <Autocomplete.Item value="base-ui">base-ui</Autocomplete.Item>
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </Field.Root>
          <button type="submit" data-testid="submit-btn">
            Submit
          </button>
        </Form>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.type(input, 'base ui');

      expect(input.getAttribute('name'), 'input should have name attribute').to.equal('query');
      expect(input.value, 'input should have typed value').to.equal('base ui');

      await user.click(screen.getByText('Submit'));

      expect(submitted).to.equal('base ui');
    });

    it('triggers native validation when required and empty', async () => {
      const { user } = await render(
        <Form>
          <Field.Root name="auto" data-testid="field">
            <Autocomplete.Root required>
              <Autocomplete.Input data-testid="input" />
            </Autocomplete.Root>
            <Field.Error match="valueMissing" data-testid="error">
              required
            </Field.Error>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      expect(screen.queryByTestId('error')).to.equal(null);

      await user.click(screen.getByText('Submit'));

      const error = screen.getByTestId('error');
      expect(error).to.have.text('required');
    });

    it('clears external errors on change', async () => {
      const { user } = await renderFakeTimers(
        <Form
          errors={{
            autocomplete: 'test',
          }}
        >
          <Field.Root name="autocomplete">
            <Autocomplete.Root>
              <Autocomplete.Input data-testid="input" />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List>
                      <Autocomplete.Item value="a">a</Autocomplete.Item>
                      <Autocomplete.Item value="b">b</Autocomplete.Item>
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
            <Field.Error data-testid="error" />
          </Field.Root>
        </Form>,
      );

      expect(screen.getByTestId('error')).to.have.text('test');

      const input = screen.getByTestId('input');
      expect(input).to.have.attribute('aria-invalid', 'true');

      await user.type(input, 'test input');
      await flushMicrotasks();

      expect(screen.queryByTestId('error')).to.equal(null);
      expect(input).not.to.have.attribute('aria-invalid');
    });

    it('submits the input value directly (not selection value)', async () => {
      let submitted: string | null = null;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        submitted = data.get('search') as string;
      };

      const { user } = await render(
        <Form onSubmit={handleSubmit}>
          <Field.Root name="search">
            <Autocomplete.Root>
              <Autocomplete.Input data-testid="input" />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List>
                      <Autocomplete.Item value="apple">apple</Autocomplete.Item>
                      <Autocomplete.Item value="banana">banana</Autocomplete.Item>
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const input = screen.getByTestId('input');
      // Type something that doesn't exactly match any option
      await user.type(input, 'appl');
      await user.click(screen.getByText('Submit'));

      expect(submitted).to.equal('appl');
    });

    it('Enter submits when no item is highlighted', async () => {
      let submitted = 0;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        submitted += 1;
      };

      const { user } = await render(
        <Form onSubmit={handleSubmit}>
          <Field.Root name="search">
            <Autocomplete.Root items={['alpha', 'beta']} openOnInputClick>
              <Autocomplete.Input />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List>
                      {(item) => (
                        <Autocomplete.Item key={item} value={item}>
                          {item}
                        </Autocomplete.Item>
                      )}
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      await user.click(screen.getByRole('combobox'));
      await user.keyboard('{Enter}');

      expect(submitted).to.equal(1);
    });

    it('pressing Enter in the Input submits the owning form when no item is highlighted', async () => {
      let submitValue: string | null = null;
      let submitCount = 0;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        submitValue = (data.get('q') as string) ?? null;
        submitCount += 1;
      };

      const { user } = await render(
        <Form onSubmit={handleSubmit}>
          <Field.Root name="q">
            <Autocomplete.Root items={['alpha', 'alpine']} submitOnItemClick>
              <Autocomplete.Input />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List>
                      {(item) => (
                        <Autocomplete.Item key={item} value={item}>
                          {item}
                        </Autocomplete.Item>
                      )}
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </Field.Root>
          <button type="submit">Submit</button>
        </Form>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');

      await user.type(input, 'xyz');
      await user.keyboard('{Enter}');

      expect(submitValue).to.equal('xyz');
      expect(submitCount).to.equal(1);
    });

    it('pressing Enter in the List when it has focus submits the owning form', async () => {
      let submitValue: string | null = null;
      let submitCount = 0;

      const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        submitValue = (data.get('q') as string) ?? null;
        submitCount += 1;
      };

      const { user } = await render(
        <Form onSubmit={handleSubmit}>
          <Field.Root name="q">
            <Autocomplete.Root items={['alpha', 'alpine']} submitOnItemClick>
              <Autocomplete.Input />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List>
                      {(item) => (
                        <Autocomplete.Item key={item} value={item}>
                          {item}
                        </Autocomplete.Item>
                      )}
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </Field.Root>
        </Form>,
      );

      const input = screen.getByRole<HTMLInputElement>('combobox');
      await user.type(input, 'al');
      await user.keyboard('{ArrowDown}');

      const alphaButton = screen.getByRole('option', { name: 'alpha' });
      expect(alphaButton).to.have.attribute('data-highlighted');

      const list = screen.getByRole('listbox');
      act(() => {
        list.focus();
      });

      await user.keyboard('{Enter}');

      expect(submitValue).to.equal('alpha');
      expect(submitCount).to.equal(1);
    });
  });

  describe('object item stringification', () => {
    it('filters and displays using label for {label} objects', async () => {
      const items = [{ label: 'United States' }, { label: 'Canada' }, { label: 'Australia' }];

      const { user } = await render(
        <Autocomplete.Root items={items}>
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: { label: string }) => (
                    <Autocomplete.Item key={item.label} value={item}>
                      {item.label}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);
      await user.type(input, 'can');

      // Should match the item by its label, not its value
      await waitFor(() => {
        expect(screen.getAllByRole('option')).to.have.length(1);
      });
      expect(screen.getByRole('option', { name: 'Canada' })).not.to.equal(null);
    });

    it('uses itemToStringValue when object lacks label', async () => {
      const items = [{ country: 'United States' }, { country: 'Canada' }, { country: 'Australia' }];

      const { user } = await render(
        <Autocomplete.Root items={items} itemToStringValue={(i) => i.country}>
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: { country: string }) => (
                    <Autocomplete.Item key={item.country} value={item}>
                      {item.country}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByTestId('input');
      await user.click(input);
      await user.type(input, 'can');

      // Should match by the provided itemToStringValue mapping
      await waitFor(() => {
        expect(screen.getAllByRole('option')).to.have.length(1);
      });
      expect(screen.getByRole('option', { name: 'Canada' })).not.to.equal(null);
    });

    it('filters and displays using value for {value} objects', async () => {
      const items = [{ value: 'United States' }, { value: 'Canada' }, { value: 'Australia' }];

      const { user } = await render(
        <Autocomplete.Root items={items}>
          <Autocomplete.Input data-testid="input" />
          <Autocomplete.Portal>
            <Autocomplete.Positioner>
              <Autocomplete.Popup>
                <Autocomplete.List>
                  {(item: { value: string }) => (
                    <Autocomplete.Item key={item.value} value={item}>
                      {item.value}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>,
      );

      const input = screen.getByTestId('input');
      await user.type(input, 'can');

      await waitFor(() => {
        expect(screen.getAllByRole('option')).to.have.length(1);
      });
      expect(screen.getByRole('option', { name: 'Canada' })).not.to.equal(null);
    });
  });

  describe('Field', () => {
    const { render: renderFakeTimers, clock } = createRenderer({
      clockOptions: {
        shouldAdvanceTime: true,
      },
    });

    clock.withFakeTimers();

    it('sets `required` on the visible input', async () => {
      await render(
        <Field.Root>
          <Autocomplete.Root required>
            <Autocomplete.Input data-testid="input" />
            <Autocomplete.Portal>
              <Autocomplete.Positioner />
            </Autocomplete.Portal>
          </Autocomplete.Root>
        </Field.Root>,
      );

      expect(screen.getByTestId('input')).to.have.attribute('required');
    });

    it('[data-touched]', async () => {
      await render(
        <Field.Root>
          <Autocomplete.Root>
            <Autocomplete.Input data-testid="input" />
            <Autocomplete.Portal>
              <Autocomplete.Positioner>
                <Autocomplete.Popup>
                  <Autocomplete.List>
                    <Autocomplete.Item value="">Select</Autocomplete.Item>
                    <Autocomplete.Item value="1">Option 1</Autocomplete.Item>
                  </Autocomplete.List>
                </Autocomplete.Popup>
              </Autocomplete.Positioner>
            </Autocomplete.Portal>
          </Autocomplete.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      expect(input).not.to.have.attribute('data-touched');

      fireEvent.focus(input);
      fireEvent.blur(input);

      await flushMicrotasks();

      expect(input).to.have.attribute('data-touched', '');
    });

    it('[data-dirty]', async () => {
      const { user } = await renderFakeTimers(
        <Field.Root>
          <Autocomplete.Root>
            <Autocomplete.Input data-testid="input" />
            <Autocomplete.Portal>
              <Autocomplete.Positioner>
                <Autocomplete.Popup>
                  <Autocomplete.List>
                    <Autocomplete.Item value="">Select</Autocomplete.Item>
                    <Autocomplete.Item value="1">Option 1</Autocomplete.Item>
                  </Autocomplete.List>
                </Autocomplete.Popup>
              </Autocomplete.Positioner>
            </Autocomplete.Portal>
          </Autocomplete.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      expect(input).not.to.have.attribute('data-dirty');

      await user.type(input, 'test');
      await flushMicrotasks();

      expect(input).to.have.attribute('data-dirty', '');
    });

    describe('[data-filled]', () => {
      it('adds [data-filled] attribute when input has content', async () => {
        const { user } = await renderFakeTimers(
          <Field.Root>
            <Autocomplete.Root>
              <Autocomplete.Input data-testid="input" />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List>
                      <Autocomplete.Item value="">Select</Autocomplete.Item>
                      <Autocomplete.Item value="1">Option 1</Autocomplete.Item>
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </Field.Root>,
        );

        const input = screen.getByTestId('input');

        expect(input).not.to.have.attribute('data-filled');

        await user.type(input, 'test input');
        await flushMicrotasks();

        expect(input).to.have.attribute('data-filled', '');
      });

      it('adds [data-filled] attribute when already filled with defaultValue', async () => {
        await render(
          <Field.Root>
            <Autocomplete.Root defaultValue="initial value">
              <Autocomplete.Input data-testid="input" />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List>
                      <Autocomplete.Item value="1">Option 1</Autocomplete.Item>
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </Field.Root>,
        );

        const input = screen.getByTestId('input');

        expect(input).to.have.attribute('data-filled');
      });
    });

    it('[data-focused]', async () => {
      await render(
        <Field.Root>
          <Autocomplete.Root>
            <Autocomplete.Input data-testid="input" />
            <Autocomplete.Portal>
              <Autocomplete.Positioner>
                <Autocomplete.Popup>
                  <Autocomplete.List>
                    <Autocomplete.Item value="">Select</Autocomplete.Item>
                    <Autocomplete.Item value="1">Option 1</Autocomplete.Item>
                  </Autocomplete.List>
                </Autocomplete.Popup>
              </Autocomplete.Positioner>
            </Autocomplete.Portal>
          </Autocomplete.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      expect(input).not.to.have.attribute('data-focused');

      fireEvent.focus(input);

      expect(input).to.have.attribute('data-focused', '');

      fireEvent.blur(input);

      expect(input).not.to.have.attribute('data-focused');
    });

    it('[data-invalid]', async () => {
      await render(
        <Field.Root invalid>
          <Autocomplete.Root>
            <Autocomplete.Input data-testid="input" />
            <Autocomplete.Portal>
              <Autocomplete.Positioner>
                <Autocomplete.Popup>
                  <Autocomplete.List>
                    <Autocomplete.Item value="1">Option 1</Autocomplete.Item>
                  </Autocomplete.List>
                </Autocomplete.Popup>
              </Autocomplete.Positioner>
            </Autocomplete.Portal>
          </Autocomplete.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      expect(input).to.have.attribute('data-invalid', '');
    });

    it('[data-valid]', async () => {
      const { user } = await render(
        <Field.Root validationMode="onBlur">
          <Autocomplete.Root required>
            <Autocomplete.Input data-testid="input" />
            <Autocomplete.Portal>
              <Autocomplete.Positioner>
                <Autocomplete.Popup>
                  <Autocomplete.List>
                    <Autocomplete.Item value="1">Option 1</Autocomplete.Item>
                  </Autocomplete.List>
                </Autocomplete.Popup>
              </Autocomplete.Positioner>
            </Autocomplete.Portal>
          </Autocomplete.Root>
        </Field.Root>,
      );

      const input = screen.getByRole('combobox');
      expect(input).not.to.have.attribute('data-valid');
      expect(input).not.to.have.attribute('data-invalid');

      await user.type(input, 'ok');
      await act(async () => input.blur());
      await flushMicrotasks();

      expect(input).to.have.attribute('data-valid', '');
      expect(input).not.to.have.attribute('data-invalid');
    });

    it('prop: validate', async () => {
      await render(
        <Field.Root validationMode="onBlur" validate={() => 'error'}>
          <Autocomplete.Root>
            <Autocomplete.Input data-testid="input" />
            <Autocomplete.Portal>
              <Autocomplete.Positioner />
            </Autocomplete.Portal>
          </Autocomplete.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.have.attribute('aria-invalid');

      fireEvent.focus(input);
      fireEvent.blur(input);
      await flushMicrotasks();
      expect(input).to.have.attribute('aria-invalid', 'true');
    });

    it('prop: validationMode=onSubmit', async () => {
      const { user } = await render(
        <Form>
          <Field.Root
            validate={(value) => {
              return value === 'one' ? 'error' : null;
            }}
          >
            <Autocomplete.Root required>
              <Autocomplete.Input data-testid="input" />
              <Autocomplete.Portal>
                <Autocomplete.Positioner>
                  <Autocomplete.Popup>
                    <Autocomplete.List>
                      <Autocomplete.Item value="one">Option 1</Autocomplete.Item>
                      <Autocomplete.Item value="two">Option 2</Autocomplete.Item>
                    </Autocomplete.List>
                  </Autocomplete.Popup>
                </Autocomplete.Positioner>
              </Autocomplete.Portal>
            </Autocomplete.Root>
          </Field.Root>
          <button type="submit">submit</button>
        </Form>,
      );

      const input = screen.getByTestId('input');
      expect(input).not.to.have.attribute('aria-invalid');

      await user.click(screen.getByText('submit'));
      expect(input).to.have.attribute('aria-invalid', 'true');

      await user.type(input, 'two');
      expect(input).not.to.have.attribute('aria-invalid');

      await user.clear(input);
      await user.type(input, 'one');
      expect(input).to.have.attribute('aria-invalid', 'true');

      await user.clear(input);
      await user.type(input, 'three');
      expect(input).not.to.have.attribute('aria-invalid');
    });

    // flaky in real browser
    it.skipIf(!isJSDOM)('prop: validationMode=onChange', async () => {
      const { user } = await render(
        <Field.Root
          validationMode="onChange"
          validate={(value) => {
            return value === 'invalid' ? 'error' : null;
          }}
        >
          <Autocomplete.Root>
            <Autocomplete.Input data-testid="input" />
            <Autocomplete.Portal>
              <Autocomplete.Positioner>
                <Autocomplete.Popup>
                  <Autocomplete.List>
                    <Autocomplete.Item value="valid">Valid Option</Autocomplete.Item>
                  </Autocomplete.List>
                </Autocomplete.Popup>
              </Autocomplete.Positioner>
            </Autocomplete.Portal>
          </Autocomplete.Root>
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      expect(input).not.to.have.attribute('aria-invalid');

      await user.type(input, 'invalid');

      expect(input).to.have.attribute('aria-invalid', 'true');
    });

    // flaky in real browser
    it.skipIf(!isJSDOM)('prop: validationMode=onBlur', async () => {
      const { user } = await render(
        <Field.Root
          validationMode="onBlur"
          validate={(value) => {
            return value === 'invalid' ? 'error' : null;
          }}
        >
          <Autocomplete.Root>
            <Autocomplete.Input data-testid="input" />
            <Autocomplete.Portal>
              <Autocomplete.Positioner>
                <Autocomplete.Popup>
                  <Autocomplete.List>
                    <Autocomplete.Item value="valid">Valid Option</Autocomplete.Item>
                  </Autocomplete.List>
                </Autocomplete.Popup>
              </Autocomplete.Positioner>
            </Autocomplete.Portal>
          </Autocomplete.Root>
          <Field.Error data-testid="error" />
        </Field.Root>,
      );

      const input = screen.getByTestId('input');

      expect(input).not.to.have.attribute('aria-invalid');

      await user.type(input, 'invalid');

      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).to.have.attribute('aria-invalid', 'true');
      });
    });

    it('Field.Label', async () => {
      await render(
        <Field.Root>
          <Autocomplete.Root>
            <Autocomplete.Input data-testid="input" />
            <Autocomplete.Portal>
              <Autocomplete.Positioner />
            </Autocomplete.Portal>
          </Autocomplete.Root>
          <Field.Label data-testid="label" render={<span />} nativeLabel={false} />
        </Field.Root>,
      );

      expect(screen.getByTestId('input')).to.have.attribute(
        'aria-labelledby',
        screen.getByTestId('label').id,
      );
    });

    it('Field.Description', async () => {
      await render(
        <Field.Root>
          <Autocomplete.Root>
            <Autocomplete.Input data-testid="input" />
            <Autocomplete.Portal>
              <Autocomplete.Positioner />
            </Autocomplete.Portal>
          </Autocomplete.Root>
          <Field.Description data-testid="description" />
        </Field.Root>,
      );

      expect(screen.getByTestId('input')).to.have.attribute(
        'aria-describedby',
        screen.getByTestId('description').id,
      );
    });
  });
});
