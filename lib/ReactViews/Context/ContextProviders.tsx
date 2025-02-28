import { ReactNode } from "react";
import { DefaultTheme, ThemeProvider } from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import { ViewStateProvider } from "./ViewStateContext";

export const ContextProviders = (props: {
  viewState: ViewState;
  theme: DefaultTheme | ((theme: DefaultTheme) => DefaultTheme);
  children: ReactNode[];
}) => (
  <ViewStateProvider viewState={props.viewState}>
    <ThemeProvider theme={props.theme}>{props.children}</ThemeProvider>
  </ViewStateProvider>
);
