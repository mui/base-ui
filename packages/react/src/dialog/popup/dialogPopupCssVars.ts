import { generateCssVariables } from '../../utils/generateCssVariables';

export type DialogPopupCssVars = {
  /**
   * Indicates how many dialogs are nested within.
   * @type number
   * */
  nestedDialogs: string;
};

export const dialogPopupCssVars: DialogPopupCssVars = generateCssVariables(['nestedDialogs']);
