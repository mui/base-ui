const DISABLE_SCROLLBAR_CLASS_NAME = 'base-ui-disable-scrollbar';

export const styleDisableScrollbar = {
  className: DISABLE_SCROLLBAR_CLASS_NAME,
  getElement(nonce?: string) {
    return (
      <style nonce={nonce} href={DISABLE_SCROLLBAR_CLASS_NAME} precedence="base-ui:low">
        {`.${DISABLE_SCROLLBAR_CLASS_NAME}{scrollbar-width:none}.${DISABLE_SCROLLBAR_CLASS_NAME}::-webkit-scrollbar{display:none}`}
      </style>
    );
  },
};

const HIDE_NATIVE_REVEAL_CLASS_NAME = 'base-ui-hide-native-reveal';

/**
 * Hides the reveal button that Edge and Chromium on Windows add to password inputs, for inputs
 * whose visibility a component controls.
 */
export const styleHideNativeReveal = {
  className: HIDE_NATIVE_REVEAL_CLASS_NAME,
  getElement(nonce?: string) {
    return (
      <style nonce={nonce} href={HIDE_NATIVE_REVEAL_CLASS_NAME} precedence="base-ui:low">
        {`.${HIDE_NATIVE_REVEAL_CLASS_NAME}::-ms-reveal{display:none}`}
      </style>
    );
  },
};
