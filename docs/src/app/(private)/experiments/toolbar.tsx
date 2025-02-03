'use client';
import * as React from 'react';
import { Separator } from '@base-ui-components/react/separator';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Select } from '@base-ui-components/react/select';
import { Menu } from '@base-ui-components/react/menu';
import s from './toolbar.module.css';
import selectClasses from '../../(public)/(content)/react/components/select/demos/hero/css-modules/index.module.css';
import menuClasses from '../../(public)/(content)/react/components/menu/demos/hero/css-modules/index.module.css';
import '../../../demo-theme.css';

const DISABLED = false;

export default function App() {
  return (
    <React.Fragment>
      <a href="https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/">toolbar pattern</a>
      <Toolbar.Root className={s.Root}>
        <Toolbar.Button
          disabled={DISABLED}
          className={s.Button}
          onClick={() => console.log('clicked a regular toolbar button')}
        >
          A regular button
        </Toolbar.Button>
        <Toolbar.Link className={s.Button} href="https://base-ui.com">
          Visit base-ui.com
        </Toolbar.Link>
        <Select.Root defaultValue="sans">
          <Toolbar.Button
            disabled={DISABLED}
            render={<Select.Trigger />}
            className={selectClasses.Select}
          >
            <Select.Value placeholder="Sans-serif" />
            <Select.Icon className={selectClasses.SelectIcon}>
              <ChevronUpDownIcon />
            </Select.Icon>
          </Toolbar.Button>
          <Select.Portal>
            <Select.Positioner className={selectClasses.Positioner} sideOffset={8}>
              <Select.Popup
                className={selectClasses.Popup}
                style={{ backgroundColor: 'var(--color-gray-50)' }}
              >
                <Select.Arrow className={selectClasses.Arrow}>
                  <ArrowSvg />
                </Select.Arrow>
                <Select.Item className={selectClasses.Item} value="sans">
                  <Select.ItemIndicator className={selectClasses.ItemIndicator}>
                    <CheckIcon className={selectClasses.ItemIndicatorIcon} />
                  </Select.ItemIndicator>
                  <Select.ItemText className={selectClasses.ItemText}>
                    Sans-serif
                  </Select.ItemText>
                </Select.Item>
                <Select.Item className={selectClasses.Item} value="serif">
                  <Select.ItemIndicator className={selectClasses.ItemIndicator}>
                    <CheckIcon className={selectClasses.ItemIndicatorIcon} />
                  </Select.ItemIndicator>
                  <Select.ItemText className={selectClasses.ItemText}>
                    Serif
                  </Select.ItemText>
                </Select.Item>
                <Select.Item className={selectClasses.Item} value="mono">
                  <Select.ItemIndicator className={selectClasses.ItemIndicator}>
                    <CheckIcon className={selectClasses.ItemIndicatorIcon} />
                  </Select.ItemIndicator>
                  <Select.ItemText className={selectClasses.ItemText}>
                    Monospace
                  </Select.ItemText>
                </Select.Item>
                <Select.Item className={selectClasses.Item} value="cursive">
                  <Select.ItemIndicator className={selectClasses.ItemIndicator}>
                    <CheckIcon className={selectClasses.ItemIndicatorIcon} />
                  </Select.ItemIndicator>
                  <Select.ItemText className={selectClasses.ItemText}>
                    Cursive
                  </Select.ItemText>
                </Select.Item>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>

        <Toolbar.Separator className={s.Separator} />

        <Toolbar.Group
          render={<ToggleGroup toggleMultiple />}
          defaultValue={[]}
          className={s.ToggleGroup}
        >
          <Toolbar.Button
            render={<Toggle />}
            aria-label="Bold"
            value="bold"
            className={s.Toggle}
            disabled={DISABLED}
          >
            <BoldIcon className={s.Icon} />
          </Toolbar.Button>
          <Toolbar.Button
            render={<Toggle />}
            aria-label="Italics"
            value="italics"
            className={s.Toggle}
            disabled={DISABLED}
          >
            <ItalicsIcon className={s.Icon} />
          </Toolbar.Button>
          <Toolbar.Button
            render={<Toggle />}
            aria-label="Underline"
            value="underline"
            className={s.Toggle}
            disabled={DISABLED}
          >
            <UnderlineIcon className={s.Icon} />
          </Toolbar.Button>
        </Toolbar.Group>

        <Toolbar.Separator className={s.Separator} />

        <Toolbar.Group
          render={<ToggleGroup />}
          defaultValue={['left']}
          className={s.ToggleGroup}
          disabled={DISABLED}
        >
          <Toolbar.Button
            render={<Toggle />}
            aria-label="Align left"
            value="left"
            className={s.Toggle}
          >
            <AlignLeftIcon className={s.Icon} />
          </Toolbar.Button>
          <Toolbar.Button
            render={<Toggle />}
            aria-label="Align center"
            value="center"
            className={s.Toggle}
          >
            <AlignCenterIcon className={s.Icon} />
          </Toolbar.Button>
          <Toolbar.Button
            render={<Toggle />}
            aria-label="Align right"
            value="right"
            className={s.Toggle}
          >
            <AlignRightIcon className={s.Icon} />
          </Toolbar.Button>
        </Toolbar.Group>

        <Toolbar.Separator className={s.Separator} />

        <Menu.Root>
          <Toolbar.Button
            disabled={DISABLED}
            render={<Menu.Trigger />}
            className={s.More}
          >
            <MoreHorizontalIcon className={s.Icon} />
          </Toolbar.Button>
          <Menu.Portal>
            <Menu.Positioner className={menuClasses.Positioner} sideOffset={8}>
              <Menu.Popup
                className={menuClasses.Popup}
                style={{ backgroundColor: 'var(--color-gray-50)' }}
              >
                <Menu.Arrow
                  className={menuClasses.Arrow}
                  style={{ color: 'var(--color-gray-50)' }}
                >
                  <ArrowSvg />
                </Menu.Arrow>
                <Menu.Item className={menuClasses.Item}>Zoom in</Menu.Item>
                <Menu.Item className={menuClasses.Item}>Zoom out</Menu.Item>
                <Menu.Item className={menuClasses.Item}>Reset zoom</Menu.Item>
                <Menu.Separator className={menuClasses.Separator} />
                <Menu.Item className={menuClasses.Item}>Minimize</Menu.Item>
                <Menu.Item className={menuClasses.Item}>Maximize</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Toolbar.Root>
      <textarea name="" id="" />
    </React.Fragment>
  );
}

function classNames(...c: Array<string | undefined | null | false>) {
  return c.filter(Boolean).join(' ');
}

function MySeparator(props: React.ComponentProps<'div'>) {
  return <Separator className={s.Separator} {...props} />;
}

function AlignLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="17" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  );
}

function AlignCenterIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="18" y1="10" x2="6" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="18" y1="18" x2="6" y2="18" />
    </svg>
  );
}

function AlignRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="21" y1="10" x2="7" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="21" y1="18" x2="7" y2="18" />
    </svg>
  );
}

function BoldIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  );
}

function ItalicsIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function UnderlineIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        fill={props.fill ?? 'currentColor'}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={selectClasses.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={selectClasses.ArrowInnerStroke}
      />
    </svg>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function MoreHorizontalIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function MoveIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <line x1="12" x2="12" y1="2" y2="22" />
    </svg>
  );
}

function MarqueeIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M5.519 3.036a3.024 3.024 0 0 0-2.032 1.329A3.027 3.027 0 0 0 3 5.945c0 .33.087.549.298.76a.996.996 0 0 0 1.548-.173c.092-.144.137-.296.158-.532.03-.33.127-.551.32-.725.194-.175.363-.243.676-.271.236-.02.388-.066.532-.158a.996.996 0 0 0 .173-1.548c-.219-.219-.434-.3-.789-.295a3.124 3.124 0 0 0-.397.033m3.217-.002a.941.941 0 0 0-.441.264.994.994 0 0 0 .175 1.549c.224.143.262.147 1.327.14l.967-.007.157-.075a1.07 1.07 0 0 0 .487-.488c.087-.183.114-.477.064-.667a1.114 1.114 0 0 0-.49-.627c-.199-.113-.3-.123-1.249-.12-.633 0-.92.01-.997.031m4.49.004c-.32.086-.609.38-.698.712-.05.19-.023.484.064.669.095.203.281.39.487.486l.157.075.967.007c1.066.007 1.103.003 1.329-.141a.996.996 0 0 0 .173-1.548.928.928 0 0 0-.453-.265c-.18-.048-1.844-.044-2.026.005m4.51-.004a.941.941 0 0 0-.441.264.994.994 0 0 0 .175 1.549c.142.09.295.136.53.157.313.028.482.096.676.27.193.175.29.397.32.726.03.34.125.547.34.744.287.266.747.33 1.107.154.154-.076.367-.28.44-.424.122-.238.147-.53.08-.942a3.004 3.004 0 0 0-2.055-2.39c-.399-.13-.92-.178-1.172-.108M3.808 8.016a1.09 1.09 0 0 0-.691.51C3.008 8.74 3 8.818 3 9.758c0 .949.009 1.035.126 1.234.127.217.387.416.624.48.19.05.484.023.667-.064a1.07 1.07 0 0 0 .488-.487l.075-.157.007-.966c.007-1.084.003-1.122-.158-1.352a1.027 1.027 0 0 0-1.021-.43m16.01 0c-.26.046-.514.22-.665.454-.143.224-.147.262-.14 1.327l.007.967.075.157c.097.206.283.392.486.487.185.087.48.114.67.064.241-.065.5-.267.626-.49.113-.197.123-.301.123-1.237 0-.911-.01-1.01-.108-1.201a1.076 1.076 0 0 0-.535-.48 1.226 1.226 0 0 0-.538-.048M3.684 12.548a1.04 1.04 0 0 0-.646.674c-.051.177-.056 1.84-.005 2.03a.931.931 0 0 0 .265.453.996.996 0 0 0 1.548-.173c.144-.226.148-.263.14-1.33l-.006-.966-.075-.157a1.062 1.062 0 0 0-.488-.488c-.135-.063-.188-.074-.385-.08-.171-.005-.258.004-.348.037m16.032-.01c-.272.086-.5.284-.621.54l-.075.158-.007.967c-.007 1.065-.003 1.103.14 1.327a1.01 1.01 0 0 0 1.29.368c.154-.075.367-.28.44-.424.109-.212.116-.293.117-1.219 0-.936-.01-1.04-.123-1.238a1.102 1.102 0 0 0-.591-.478 1.313 1.313 0 0 0-.57-.001M3.808 17.016a1.005 1.005 0 0 0-.51.279c-.211.211-.297.43-.298.76a3.004 3.004 0 0 0 2.532 2.91c.566.09.893.017 1.173-.263a.996.996 0 0 0-.173-1.548c-.144-.092-.296-.137-.532-.158-.33-.03-.551-.127-.725-.32-.175-.194-.243-.363-.271-.676-.032-.36-.142-.582-.388-.782a1.043 1.043 0 0 0-.808-.202m16.01 0c-.26.046-.514.22-.665.454-.09.142-.136.295-.157.53-.028.313-.096.482-.27.676-.175.193-.397.29-.726.32-.34.03-.547.125-.744.34-.266.287-.33.747-.154 1.107.076.154.28.367.424.44.484.248 1.418.082 2.12-.375.281-.184.678-.581.862-.862.45-.69.623-1.64.384-2.102a1.076 1.076 0 0 0-.535-.48 1.226 1.226 0 0 0-.538-.048M8.676 19.052a1.014 1.014 0 0 0-.574 1.39c.075.155.28.368.424.441.212.109.293.116 1.219.117.936 0 1.04-.01 1.238-.123.222-.126.424-.385.489-.627.05-.19.023-.484-.064-.669a1.06 1.06 0 0 0-.487-.486l-.157-.075-.984-.005c-.877-.004-.997 0-1.104.037m4.523-.01c-.28.104-.49.291-.607.54a1.122 1.122 0 0 0-.064.668c.065.242.267.501.49.627.197.113.301.123 1.237.123.926 0 1.007-.008 1.219-.117.143-.073.349-.286.424-.44.265-.543-.027-1.225-.6-1.399-.162-.049-1.967-.05-2.1-.001"
      />
    </svg>
  );
}

function LassoIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="m11.148 1.022-.396.035c-2.295.201-4.57 1.065-6.276 2.384A10.3 10.3 0 0 0 2.823 5.04c-.96 1.2-1.518 2.44-1.746 3.876-.073.458-.09 1.41-.034 1.91a7.763 7.763 0 0 0 1.255 3.485l.109.164-.11.233a2.79 2.79 0 0 0-.243.724 3.003 3.003 0 0 0 .827 2.687c.303.304.733.58 1.084.695.077.025.091.042.104.118.236 1.463 1.023 2.827 2.148 3.723.36.287.45.325.779.325.237 0 .278-.007.404-.066a.952.952 0 0 0 .421-.35.893.893 0 0 0 .171-.556c0-.348-.122-.585-.432-.84-.585-.483-.974-.989-1.235-1.608-.104-.247-.229-.638-.229-.717 0-.027.072-.076.21-.144a2.92 2.92 0 0 0 .669-.442l.134-.122.363.126c1.91.666 3.866.883 5.974.663 1.998-.209 3.958-.91 5.55-1.986 1.251-.845 2.293-1.943 2.968-3.126a7.91 7.91 0 0 0 .972-2.808c.068-.451.061-1.63-.011-2.088-.394-2.475-1.906-4.611-4.325-6.112-1.5-.93-3.245-1.511-5.226-1.738-.31-.036-1.965-.068-2.226-.044m.3 1.992-.432.035c-3.68.299-6.843 2.457-7.75 5.287a4.978 4.978 0 0 0-.25 1.636c-.002 1.065.214 1.908.73 2.856.213.39.17.361.421.29.335-.094.546-.117.937-.105.255.009.42.027.583.067a3.007 3.007 0 0 1 2.234 2.233c.041.171.057.322.066.615l.01.388.206.075c.561.204 1.44.415 2.105.505.93.125 2.156.13 3.108.01 1.667-.21 3.286-.81 4.55-1.69.585-.407 1.274-1.042 1.666-1.536.707-.89 1.152-1.883 1.311-2.928a6.909 6.909 0 0 0 .012-1.416c-.286-2.085-1.665-3.896-3.88-5.095-1.162-.63-2.502-1.03-3.959-1.183-.32-.033-1.44-.063-1.668-.044m-6.644 12.01a1.002 1.002 0 0 0-.79.909.932.932 0 0 0 .299.773.92.92 0 0 0 .754.28c.658-.037 1.095-.72.86-1.343a1.05 1.05 0 0 0-.57-.572 1.26 1.26 0 0 0-.553-.047"
      />
    </svg>
  );
}

function CropIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M6.13 1 6 16a2 2 0 0 0 2 2h15" />
      <path d="M1 6.13 16 6a2 2 0 0 1 2 2v15" />
    </svg>
  );
}
