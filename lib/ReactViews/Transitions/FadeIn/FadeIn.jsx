import PropTypes from "prop-types";

import { CSSTransition } from "react-transition-group";

import Styles from "./fade-in.scss";

export function SlideUpFadeIn({
  isVisible,
  children,
  onEnter = () => {},
  onExited = () => {},
  transitionProps
}) {
  return (
    <CSSTransition
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

SlideUpFadeIn.propTypes = {
  children: PropTypes.node.isRequired,
  isVisible: PropTypes.bool.isRequired,
  onEnter: PropTypes.func,
  onExited: PropTypes.func,
  transitionProps: PropTypes.object
};

export default SlideUpFadeIn;
