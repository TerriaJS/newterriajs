import React from "react";
import PropTypes from "prop-types";
import Styles from "./guidance-dot.scss";

export const GuidanceDot = ({ onClick }: any) => {
  return (
    <button className={Styles.oval} onClick={onClick}>
      <div className={Styles.innerClone} />
      <div className={Styles.inner} />
    </button>
  );
};
GuidanceDot.propTypes = {
  onClick: PropTypes.func.isRequired
};

export default GuidanceDot;
