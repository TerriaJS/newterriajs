import PropTypes from "prop-types";

/**
 * Higher-order component that either shows a one element or the other, depending on whether the "smallScreen" prop
 * passed to it is true or false.
 */
export default (LargeScreenComponent, SmallScreenComponent) => {
  function ResponsiveSwitch(props) {
    return props.smallScreen ? (
      <SmallScreenComponent {...props} />
    ) : (
      <LargeScreenComponent {...props} />
    );
  }

  ResponsiveSwitch.propTypes = {
    smallScreen: PropTypes.bool
  };

  return ResponsiveSwitch;
};
