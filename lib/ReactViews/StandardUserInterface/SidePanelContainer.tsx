import { action } from "mobx";
import styled from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import { withViewState, type WithViewState } from "../Context";

interface PropsType extends WithViewState {
  viewState: ViewState;
  show: boolean;
  children: React.ReactNode;
}

const SidePanelContainer = styled.div.attrs<PropsType>(({ viewState }) => ({
  className: viewState.topElement === "SidePanel" ? "top-element" : "",
  onClick: action(() => {
    viewState.topElement = "SidePanel";
  }),
  onTransitionEnd: () => viewState.triggerResizeEvent()
}))<PropsType>`
  display: flex;
  flex-direction: column;
  position: relative;
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
`;

export default withViewState(SidePanelContainer);
