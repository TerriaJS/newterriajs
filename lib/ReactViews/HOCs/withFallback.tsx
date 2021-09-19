import {
  ComponentClass,
  FunctionComponent,
  ComponentProps,
  Suspense
} from "react";
import PropTypes from "prop-types";

import ViewState from "../../ReactViewModels/ViewState";
import Terria from "../../Models/Terria";

interface WithFallbackProps {
  terria: Terria;
  viewState: ViewState;
}

// TODO: better fallback
// This is used as i18n can be configured by a TerriaMap to run & use suspense,
// which will use the suspend API & will throw without a suspend component in
// the tree - of which we don't currently have at any point

/**
 * HOC for a basic fallback UI incase any dependencies end up using suspense
 * features
 */
export const withFallback = <P extends ComponentProps<any>>(
  WrappedComponent: ComponentClass<P> | FunctionComponent<P>
) => {
  const WithFallback = (props: P & WithFallbackProps) => {
    return (
      <Suspense fallback={"Loading..."}>
        <WrappedComponent {...props} />
      </Suspense>
    );
  };
  WithFallback.propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired
  };
  return WithFallback;
};

export default withFallback;
