import React from "react";

interface PropsType {
  isVisible?: boolean;
  onEnter?: () => void;
  onExited?: () => void;
  transitionProps?: any;
}

declare const FadeIn: React.FC<React.PropsWithChildren<PropsType>>;
export default FadeIn;
