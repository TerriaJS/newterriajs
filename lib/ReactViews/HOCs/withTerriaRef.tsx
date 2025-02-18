import { ComponentClass, FunctionComponent, ComponentProps } from "react";
import PropTypes from "prop-types";

import ViewState from "../../ReactViewModels/ViewState";
import { useRefForTerria } from "../Hooks/useRefForTerria";

interface WithTerriaRefProps {
  viewState: ViewState;
}

/*
    HOC to set a ref and store it in viewState
*/
export const withTerriaRef = <P extends ComponentProps<any>>(
  WrappedComponent:
    | ComponentClass<P>
    | FunctionComponent<React.PropsWithChildren<P>>,
  refName: string
) => {
  const WithTerriaRef = (props: P & WithTerriaRefProps) => {
    const hocRef = useRefForTerria(refName, props.viewState);
    return <WrappedComponent refFromHOC={hocRef} {...props} />;
  };
  WithTerriaRef.propTypes = {
    viewState: PropTypes.object.isRequired
  };
  return WithTerriaRef;
};

export default withTerriaRef;
