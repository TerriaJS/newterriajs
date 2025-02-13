import { ReactNode, Component, ErrorInfo } from "react";
import { TerriaErrorOverrides } from "../../Core/TerriaError";
import ViewState from "../../ReactViewModels/ViewState";

type PropsType = {
  viewState: ViewState;
  // Pass in options to customize the title and other presentation aspects of the error
  terriaErrorOptions?: TerriaErrorOverrides;
  children?: ReactNode;
};

/**
 * An error boundary that raises the error to the user.
 */
export default class RaiseToUserErrorBoundary extends Component<PropsType> {
  state = { hasError: false };

  static getDerivedStateFromError(_error: Error) {
    return {
      hasError: true
    };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    this.props.viewState.terria.raiseErrorToUser(
      error,
      this.props.terriaErrorOptions
    );
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
