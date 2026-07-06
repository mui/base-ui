import { Menu } from "@base-ui-components/react/menu";
import clsx from "clsx";
import { ArrowSvg } from "./shared/arrow-svg";

export type MenuArrowProps = React.ComponentPropsWithoutRef<typeof Menu.Arrow>;

export const MenuArrow: React.FC<MenuArrowProps> = ({
  className,
  ...props
}) => {
  return (
    <Menu.Arrow
      {...props}
      className={clsx(
        "data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90",
        "data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180",
        className
      )}
    >
      <ArrowSvg />
    </Menu.Arrow>
  );
};
