import PropTypes from "prop-types";
import Styles from "./input.scss";
import classNames from "classnames";

const Input = props => {
  // things like large, light etc aren't valid html bool attrs, separate them here
  const { large, light, dark, className, ...remainingProps } = props;
  return (
    <input
      {...remainingProps}
      className={classNames(Styles.input, {
        [Styles.large]: large,
        [Styles.light]: light,
        [Styles.dark]: dark,
        [className]: className
      })}
    />
  );
};

Input.propTypes = {
  className: PropTypes.string,
  large: PropTypes.bool,
  dark: PropTypes.bool,
  light: PropTypes.bool
};

// Input.defaultProps = {
// };

export default Input;
