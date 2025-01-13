import { action, runInAction } from "mobx";
import { observer } from "mobx-react";
import React, { useEffect } from "react";
import styled from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import Button from "../../Styled/Button";
import { IconProps, StyledIcon } from "../../Styled/Icon";
import { addTerriaScrollbarStyles } from "../../Styled/mixins";
import Text from "../../Styled/Text";
import { PortalChild } from "../StandardUserInterface/Portal";
import { PanelButton } from "./Panel";

export const WorkflowPanelPortalId = "workflow-panel-portal";

type PropsType = {
  viewState: ViewState;
  title: string;
  icon: IconProps["glyph"];
  onClose: () => void;
  closeButtonText: string;
  footer?: {
    onClick: () => void;
    buttonText: string;
  };
};

/** Wraps component in Portal, adds TitleBar, ErrorBoundary and Footer (PanelButton) */
const WorkflowPanel: React.FC<PropsType> = observer((props) => {
  const viewState = props.viewState;

  useEffect(function hideTerriaSidePanelOnMount() {
    runInAction(() => {
      viewState.terria.isWorkflowPanelActive = true;
    });
    return () => {
      runInAction(() => {
        viewState.terria.isWorkflowPanelActive = false;
      });
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  return (
    <PortalChild viewState={viewState} portalId={WorkflowPanelPortalId}>
      <Container
        className={
          viewState.topElement === "WorkflowPanel" ? "top-element" : ""
        }
        onClick={action(() => {
          viewState.topElement = "WorkflowPanel";
        })}
      >
        <TitleBar>
          <Icon glyph={props.icon} />
          <Title>{props.title}</Title>
          <CloseButton onClick={props.onClose}>
            {props.closeButtonText}
          </CloseButton>
        </TitleBar>
        <Content>
          <ErrorBoundary viewState={viewState}>{props.children}</ErrorBoundary>
        </Content>
        {props.footer ? (
          <PanelButton
            onClick={props.footer.onClick}
            title={props.footer.buttonText}
          />
        ) : null}
      </Container>
    </PortalChild>
  );
});

type ErrorBoundaryProps = {
  viewState: ViewState;
  children: React.ReactNode;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    this.props.viewState.terria.raiseErrorToUser(error);
  }

  render() {
    return this.state.hasError ? (
      <Error>
        An error occurred when running the workflow. Please try re-loading the
        app if the error persists.
      </Error>
    ) : (
      this.props.children
    );
  }
}

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  font-family: ${(p) => p.theme.fontPop}px;
  width: ${(p) => p.theme.workflowPanelWidth}px;
  height: calc(100vh - 2 * ${(p) => p.theme.workbenchMargin}px);
  max-width: ${(p) => p.theme.workflowPanelWidth}px;
  box-sizing: border-box;
  padding: 0 0 5px;
`;

const TitleBar = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0.7em;
  border-bottom: 1px solid ${(p) => p.theme.darkLighter};
`;

const Title = styled(Text).attrs({
  textLight: true,
  extraExtraLarge: true
})`
  flex-grow: 1;
  padding: 0 1em;
`;

const Icon = styled(StyledIcon).attrs({
  styledWidth: "24px",
  styledHeight: "24px",
  light: true
})``;

const Content = styled.div`
  flex-grow: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 4em;
  ${addTerriaScrollbarStyles()}
`;

const CloseButton = styled(Button).attrs({
  primary: true
})``;

const Error = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: ${(p) => p.theme.textLight};
  font-size: 14px;
`;

export default WorkflowPanel;
