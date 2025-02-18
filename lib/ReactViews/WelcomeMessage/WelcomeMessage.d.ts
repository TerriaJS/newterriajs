import React from "react";

interface WelcomeMessagePurePropsType {
  showWelcomeMessage: boolean;
  setShowWelcomeMessage: (show: boolean) => void;
  isTopElement: boolean;
}

export declare const WelcomeMessagePure: React.FC<
  React.PropsWithChildren<WelcomeMessagePurePropsType>
>;

declare class WelcomeMessage extends React.Component<object> {}
export default WelcomeMessage;
