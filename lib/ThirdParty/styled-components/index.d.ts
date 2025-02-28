// Pull in the css prop type addition to react attributes
/// <reference types="styled-components/cssprop" />

// import your custom theme
import { CSSProp } from "styled-components";
import { terriaTheme } from "../../ReactViews/StandardUserInterface";

type Theme = typeof terriaTheme;

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}

// See https://github.com/styled-components/styled-components/issues/2528
// .css isn't included in @types/styled-components because it has to be enabled
// through a babel plugin or macro
declare module "react" {
  interface Attributes {
    css?: CSSProp;
  }
}
