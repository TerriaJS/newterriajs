import React from "react";

interface PropsType {
  isVisible: boolean;
  onEnter?: () => void;
  onExited?: () => void;
  transitionProps?: any;
}

declare const SlideUpFadeIn: React.FC<React.PropsWithChildren<PropsType>>;
export default SlideUpFadeIn;
