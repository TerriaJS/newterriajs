import IElementConfig from "../../../Models/IElementConfig";
import React from "react";

interface PropsType {
  animationDuration?: number;
  menuItems: React.ReactElement[];
  menuLeftItems: React.ReactElement[];
  elementConfig?: IElementConfig;
}

declare const MenuBar: React.FC<React.PropsWithChildren<PropsType>>;
export default MenuBar;
