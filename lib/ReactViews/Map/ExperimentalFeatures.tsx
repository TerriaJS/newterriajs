import * as React from "react";
import styled from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import { withViewState } from "../StandardUserInterface/ViewStateContext";

interface IProps {
  viewState: ViewState;
  experimentalItems?: React.ReactNode[];
}

const ControlsWrapper = styled.div`
  position: absolute;
  left: 25px;
  bottom: 25px;
  z-index: 1;

  @media (min-width: ${(props) => props.theme.sm}px) {
    top: auto;
    bottom: 100px;
  }
`;
const Control = styled.div`
  margin: 15px 0;
  text-align: center;

  &:last-child {
    margin-bottom: 0;
  }
`;
const ExperimentalFeatures: React.FC<React.PropsWithChildren<IProps>> = (
  props
) => {
  return (
    <ControlsWrapper>
      {(props.experimentalItems || []).map((item, i) => (
        <Control key={i}>{item}</Control>
      ))}
    </ControlsWrapper>
  );
};

export default withViewState(ExperimentalFeatures);
