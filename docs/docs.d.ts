// Needed until @mui/docs fixes the types

declare module '@mui/docs/Link' {
  import * as React from 'react';
  import { LinkProps as NextLinkProps } from 'next/link';
  import { LinkProps as MuiLinkProps } from '@mui/material/Link';

  interface NextLinkComposedProps
    extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>,
      Omit<
        NextLinkProps,
        'href' | 'as' | 'passHref' | 'onMouseEnter' | 'onClick' | 'onTouchStart'
      > {
    to: NextLinkProps['href'];
    linkAs?: NextLinkProps['as'];
  }
  export type LinkProps = {
    activeClassName?: string;
    as?: NextLinkProps['as'];
    href: NextLinkProps['href'];
    linkAs?: NextLinkProps['as'];
    noLinkStyle?: boolean;
  } & Omit<NextLinkComposedProps, 'to' | 'linkAs' | 'href'> &
    Omit<MuiLinkProps, 'href'>;
  export const Link: React.ForwardRefExoticComponent<
    Omit<LinkProps, 'ref'> & React.RefAttributes<HTMLAnchorElement>
  >;
  export {};
}

declare module '@mui/docs/i18n' {
  import * as React from 'react';
  import PropTypes from 'prop-types';

  declare global {
    interface NodeRequire {
      context: (path: string, useSubdirectories: boolean, regex: RegExp) => RequireContext;
    }
  }
  interface RequireContext {
    (req: string): string;
    keys: () => string[];
  }
  export interface UserLanguageProviderProps {
    children: React.ReactNode;
    defaultUserLanguage: string;
  }
  export declare function UserLanguageProvider(props: UserLanguageProviderProps): React.JSX.Element;
  export declare namespace UserLanguageProvider {
    const propTypes: {
      children: PropTypes.Validator<NonNullable<PropTypes.ReactNodeLike>>;
      defaultUserLanguage: PropTypes.Requireable<string>;
    };
  }
  export declare function useUserLanguage(): string;
  export declare function useSetUserLanguage(): React.Dispatch<React.SetStateAction<string>>;
  export interface TranslateOptions {
    ignoreWarning?: boolean;
  }
  export declare function useTranslate(): (key: string, options?: TranslateOptions) => any;
  export {};
}
