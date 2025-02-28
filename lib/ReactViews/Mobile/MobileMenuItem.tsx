import { MouseEventHandler } from "react";
import Icon, { GLYPHS } from "../../Styled/Icon";

import Styles from "./mobile-menu-item.scss";

type Props = {
  href?: string;
  onClick: MouseEventHandler<HTMLElement>;
  caption: string;
  icon: { id: keyof typeof GLYPHS };
};

const MobileMenuItem = (props: Props) => (
  <div className={Styles.root}>
    {props.href ? (
      <a
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={props.onClick}
        className={Styles.link}
      >
        {props.caption}
        {props.href !== "#" && <Icon glyph={Icon.GLYPHS.externalLink} />}
      </a>
    ) : (
      <button onClick={props.onClick} className={Styles.link}>
        {props.icon && <Icon className={Styles.icon} glyph={props.icon} />}
        {props.caption}
      </button>
    )}
  </div>
);
export default MobileMenuItem;
