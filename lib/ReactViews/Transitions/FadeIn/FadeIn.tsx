import { CSSTransition } from "react-transition-group";

import type { CSSTransitionProps } from "react-transition-group/CSSTransition";
import Styles from "./fade-in.scss";

interface Props {
  nodeRef?: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  isVisible: boolean;
  onEnter?: () => void;
  onExited?: () => void;
  transitionProps?: Partial<CSSTransitionProps>;
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
      nodeRef={nodeRef}
      in={isVisible}
      timeout={300}
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
