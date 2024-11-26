export type DialogPopupCssVars = {
  /**
   * Indicates how many dialogs are nested within.
   * @type number
   * */
  nestedDialogs: string;
};

export const cssVars: DialogPopupCssVars = {
  nestedDialogs: '--nested-dialogs',
};
