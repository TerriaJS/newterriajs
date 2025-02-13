import PropTypes, { InferProps } from "prop-types";
import MediaQuery from "react-responsive";

// This should come from some config some where
const small = 768;
const medium = 992;
const large = 1300;

// Use PropTypes and Typescript because this is widely used from JSX and TSX files
const BreakpointPropTypes = {
  children: PropTypes.node
};
type BreakpointProps = InferProps<typeof BreakpointPropTypes>;

export function ExtraSmall(props: BreakpointProps) {
  return <MediaQuery maxWidth={small}>{props.children}</MediaQuery>;
}

export function Small(props: BreakpointProps) {
  return <MediaQuery maxWidth={small - 1}>{props.children}</MediaQuery>;
}

export function Medium(props: BreakpointProps) {
  return <MediaQuery minWidth={small}>{props.children}</MediaQuery>;
}

export function Large(props: BreakpointProps) {
  return <MediaQuery minWidth={medium}>{props.children}</MediaQuery>;
}

export function ExtraLarge(props: BreakpointProps) {
  return <MediaQuery minWidth={large}>{props.children}</MediaQuery>;
}

ExtraSmall.propTypes = BreakpointPropTypes;
Small.propTypes = BreakpointPropTypes;
Medium.propTypes = BreakpointPropTypes;
Large.propTypes = BreakpointPropTypes;
ExtraLarge.propTypes = BreakpointPropTypes;
