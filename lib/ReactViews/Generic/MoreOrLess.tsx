import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import Icon from "../../Styled/Icon";

const MoreOrLess = createReactClass({
  getInitialState: function () {
    return { isOpen: this.props.initialopen };
  },
  displayName: "MoreOrLess",
  propTypes: {
    initialopen: PropTypes.bool,
    myclass: PropTypes.string
  },
  toggleIcon: function () {
    this.setState({ isOpen: !this.state.isOpen });
  },
  render: function () {
    return (
      <button
        type="button"
        onClick={this.toggleIcon}
        className={this.props.myclass}
      >
        <Icon
          glyph={
            this.state.isOpen ? Icon.GLYPHS.showLess : Icon.GLYPHS.showMore
          }
        />
      </button>
    );
  }
});

export default MoreOrLess;
