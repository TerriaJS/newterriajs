import React from "react";
import classNames from "classnames";
import Icon from "../../../Styled/Icon";
import Styles from "./menu-button.scss";

interface MenuButtonProps {
  /** The URL that the button links to. Defaults to "#" */
  href?: string;
  /** The text caption to display on the button */
  caption: string;
}

/**
 * Basic button for use in the menu part at the top of the map.
 */
const MenuButton: React.FC<MenuButtonProps> = ({ href = "#", caption }) => {
  const target = href !== "#" ? "_blank" : undefined;
  const rel = target === "_blank" ? "noreferrer" : undefined;

  return (
    <a
      className={classNames(Styles.btnAboutLink)}
      href={href}
      target={target}
      rel={rel}
      title={caption}
    >
      {href !== "#" && <Icon glyph={Icon.GLYPHS.externalLink} />}
      <span>{caption}</span>
    </a>
  );
};

MenuButton.displayName = "MenuButton";

export default MenuButton;
