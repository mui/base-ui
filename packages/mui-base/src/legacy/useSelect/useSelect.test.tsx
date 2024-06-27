import { expect } from 'chai';
import sinon from 'sinon';
import { act, renderHook } from '@mui/internal-test-utils';
import { useSelect } from './useSelect';

// TODO: re-enable once Select is fully migrated to the new API
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('useSelect', () => {
  describe('getHiddenInputProps', () => {
    it('returns props for hidden input', () => {
      const options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C', disabled: true },
      ];

      const { result } = renderHook(() =>
        useSelect({ options, defaultValue: 'b', name: 'foo', required: true }),
      );

      sinon.assert.match(result.current.getHiddenInputProps(), {
        name: 'foo',
        tabIndex: -1,
        'aria-hidden': true,
        required: true,
        value: 'b',
        style: {
          border: 0,
          clip: 'rect(0 0 0 0)',
          height: '1px',
          margin: '-1px',
          overflow: 'hidden',
          padding: 0,
          position: 'absolute',
          whiteSpace: 'nowrap',
          width: '1px',
        },
      });
    });

    it('[multiple] returns correct value for the hidden input', () => {
      const options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C', disabled: true },
      ];

      const { result } = renderHook(() =>
        useSelect({
          multiple: true,
          options,
          defaultValue: ['a', 'b'],
          name: 'foo',
          required: true,
        }),
      );

      sinon.assert.match(result.current.getHiddenInputProps(), {
        name: 'foo',
        tabIndex: -1,
        'aria-hidden': true,
        required: true,
        value: JSON.stringify(['a', 'b']),
      });
    });

    it('[multiple with object value] returns correct value for the hidden input', () => {
      const options = [
        { value: { name: 'a' }, label: 'A' },
        { value: { name: 'b' }, label: 'B' },
        { value: { name: 'c' }, label: 'C', disabled: true },
      ];

      const { result } = renderHook(() =>
        useSelect<{ name: string }, true>({
          multiple: true,
          options,
          areOptionsEqual: (a, b) => a.name === b.name,
          defaultValue: [{ name: 'a' }, { name: 'b' }],
          name: 'foo',
          required: true,
        }),
      );

      sinon.assert.match(result.current.getHiddenInputProps(), {
        name: 'foo',
        tabIndex: -1,
        'aria-hidden': true,
        required: true,
        value: JSON.stringify([{ name: 'a' }, { name: 'b' }]),
      });
    });

    describe('onChange handler', () => {
      it('calls external onChange handler', () => {
        const externalOnChangeSpy = sinon.spy();

        const { result } = renderHook(() => useSelect({}));

        const { getHiddenInputProps } = result.current;
        const { onChange: hiddenInputOnChange } = getHiddenInputProps({
          onChange: externalOnChangeSpy,
        });

        // @ts-ignore We only need the target value for this test
        hiddenInputOnChange({ target: { value: 'foo' } });
        expect(externalOnChangeSpy.calledOnce).to.equal(true);
        expect(externalOnChangeSpy.calledWith({ target: { value: 'foo' } })).to.equal(true);
      });
    });
  });

  describe('parameter: buttonRef', () => {
    it('merges buttonRef parameter with getButtonProps ref', () => {
      const buttonElement = document.createElement('button');
      const buttonRefSpy = sinon.spy();
      const { result } = renderHook(() => useSelect({ buttonRef: buttonRefSpy }));

      const { getButtonProps } = result.current;
      const { ref: propGetterRefCallback } = getButtonProps();

      expect(propGetterRefCallback).not.to.eq(null);

      act(() => {
        if (typeof propGetterRefCallback === 'function') {
          propGetterRefCallback?.(buttonElement);
        }
      });

      expect(buttonRefSpy.calledOnce).to.equal(true);
      expect(buttonRefSpy.calledWith(buttonElement)).to.equal(true);
    });

    it('merges buttonRef parameter with returned buttonRef', () => {
      const buttonElement = document.createElement('button');
      const buttonRefSpy = sinon.spy();
      const { result } = renderHook(() => useSelect({ buttonRef: buttonRefSpy }));

      const { buttonRef: returnedButtonRef } = result.current;

      expect(returnedButtonRef).not.to.eq(null);

      act(() => {
        returnedButtonRef?.(buttonElement);
      });

      expect(buttonRefSpy.calledOnce).to.equal(true);
      expect(buttonRefSpy.calledWith(buttonElement)).to.equal(true);
    });
  });

  describe('parameter: listboxRef', () => {
    it('merges listboxRef parameter with getListboxProps ref', () => {
      const listboxElement = document.createElement('ul');
      const listboxRefSpy = sinon.spy();
      const { result } = renderHook(() => useSelect({ listboxRef: listboxRefSpy }));

      const { getListboxProps } = result.current;
      const { ref: propGetterRefCallback } = getListboxProps();

      expect(propGetterRefCallback).not.to.eq(null);

      act(() => {
        if (typeof propGetterRefCallback === 'function') {
          propGetterRefCallback?.(listboxElement);
        }
      });

      expect(listboxRefSpy.calledOnce).to.equal(true);
      expect(listboxRefSpy.calledWith(listboxElement)).to.equal(true);
    });

    it('merges listboxRef parameter with returned listboxRef', () => {
      const listboxElement = document.createElement('ul');
      const listboxRefSpy = sinon.spy();
      const { result } = renderHook(() => useSelect({ listboxRef: listboxRefSpy }));

      const { listboxRef: returnedListboxRef } = result.current;

      expect(returnedListboxRef).not.to.eq(null);

      act(() => {
        returnedListboxRef?.(listboxElement);
      });

      expect(listboxRefSpy.calledOnce).to.equal(true);
      expect(listboxRefSpy.calledWith(listboxElement)).to.equal(true);
    });
  });
});
