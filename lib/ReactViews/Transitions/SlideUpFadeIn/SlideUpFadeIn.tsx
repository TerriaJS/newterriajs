import { CSSTransition } from "react-transition-group";

import type { CSSTransitionProps } from "react-transition-group/CSSTransition";
import Styles from "./slide-up-fade-in.scss";

interface Props {
  nodeRef?: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  isVisible: boolean;
  onEnter?: () => void;
  onExited?: () => void;
  transitionProps?: CSSTransitionProps;
}

export function SlideUpFadeIn({
  nodeRef,
  isVisible,
  children,
  onEnter = () => {},
  onExited = () => {},
  transitionProps
}: Props) {
  return (
    <CSSTransition
      in={isVisible}
      timeout={300}
      nodeRef={nodeRef}
      classNames={{ ...Styles }}
      unmountOnExit
      onEnter={onEnter}
      onExited={onExited}
      {...transitionProps}
    >
      {children}
    </CSSTransition>
  );
}

export default SlideUpFadeIn;
