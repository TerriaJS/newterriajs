import { action } from "mobx";
import styled from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import { withViewState } from "../Context";

type PropsType = {
  viewState: ViewState;
  show: boolean;
};

const SidePanelContainer = styled.div.attrs<PropsType>(({ viewState }) => ({
  className: viewState.topElement === "SidePanel" ? "top-element" : "",
  onClick: action(() => {
    viewState.topElement = "SidePanel";
  }),
  onTransitionEnd: () => viewState.triggerResizeEvent()
}))<PropsType>`
  display: flex;
  flex-direction: column;
  position: absolute;
  left: ${(p) => p.theme.workbenchMargin}px;
  top: ${(p) => p.theme.workbenchMargin}px;
  height: calc(100% - 2 * ${(p) => p.theme.workbenchMargin}px);
  z-index: 100;
  background: ${(p) => p.theme.transparentDark};
  backdrop-filter: ${(p) => p.theme.blur};
  font-family: ${(p) => p.theme.fontPop}px;
  width: ${(p) => p.theme.workbenchWidth}px;
  flex-basis: ${(p) => p.theme.workbenchWidth}px;
  max-width: ${(p) => p.theme.workbenchWidth}px;
  box-sizing: border-box;
  h1 {
    margin: 0;
  }

  /* slide in/out animation */
  transition: all 0.25s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  visibility: ${(p) => (p.show ? "visible" : "hidden")};
  opacity: ${(p) => (p.show ? 1 : 0)};
  margin-left: ${(p) => (p.show ? "0px" : `-${p.theme.workbenchWidth}px`)};
  border-radius: ${(p) => p.theme.radiusXL};
`;

export default withViewState(SidePanelContainer);
