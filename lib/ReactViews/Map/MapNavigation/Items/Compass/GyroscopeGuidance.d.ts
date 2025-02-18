import ViewState from "../../../../../ReactViewModels/ViewState";
import React from "react";

interface PropsType {
  viewState: ViewState;
  handleHelp?: () => void;
  onClose: () => void;
}

export declare const GyroscopeGuidance: React.FC<
  React.PropsWithChildren<PropsType>
>;
