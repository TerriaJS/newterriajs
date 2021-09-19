import PropTypes from "prop-types";

/**
 * Higher-order component that either shows a one element or the other, depending on whether the "smallScreen" prop
 * passed to it is true or false.
 */
export default (LargeScreenComponent, SmallScreenComponent) => {
  // eslint-disable-next-line require-jsdoc
  function ResponsiveSwitch(props) {
    return (
      <Choose>
        <When condition={props.smallScreen}>
          <SmallScreenComponent {...props} />
        </When>
        <Otherwise>
          <LargeScreenComponent {...props} />
        </Otherwise>
      </Choose>
    );
  }

  ResponsiveSwitch.propTypes = {
    smallScreen: PropTypes.bool
  };

  return ResponsiveSwitch;
};
