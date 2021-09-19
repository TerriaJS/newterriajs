import { ThemeProvider } from "styled-components";

import { terriaTheme } from "../../lib/ReactViews/StandardUserInterface/StandardTheme";

export function withThemeContext(component) {
  return <ThemeProvider theme={terriaTheme}>{component}</ThemeProvider>;
}
