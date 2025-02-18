import { observer } from "mobx-react";
import { FC } from "react";
import styled from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";

type PositionRightOfWorkbenchProps = {
  viewState: ViewState;
  className?: string;
};

/**
 * A component that responsively positions its children right of the workbench.
 *
 * If the workbench is hidden it will smoothly transition the children to the left edge
 * of the screen. By default the container is position 120px from the top but
 * this can be overriden by further styling the component, eg:
 *
 *    const BottomLeft = styled(PositionRightOfWorkbenchProps)`
 *       top: unset;
 *       bottom: 90px;
 *    `;
 *
 */
const PositionRightOfWorkbench: FC<
  React.PropsWithChildren<PositionRightOfWorkbenchProps>
> = observer((props) => {
  return (
    <Container
      className={props.className}
      isMapFullScreen={props.viewState.isMapFullScreen}
    >
      {props.children}
    </Container>
  );
});

const Container = styled.div<{ isMapFullScreen: boolean }>`
  position: absolute;
  top: 120px;
  left: 0;
  right: unset;
  bottom: unset;
  margin-left: ${(props) =>
    props.isMapFullScreen
      ? 16
      : parseInt(props.theme.workbenchWidth, 10) + 16}px};
  transition: margin-left 0.25s;
`;

export default PositionRightOfWorkbench;
