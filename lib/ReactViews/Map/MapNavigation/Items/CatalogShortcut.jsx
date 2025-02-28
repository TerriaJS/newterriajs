"use strict";

import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import defined from "terriajs-cesium/Source/Core/defined";
import Icon from "../../../Styled/Icon";
import Styles from "./tool_button.scss";

const CatalogShortcut = createReactClass({
  displayName: "CatalogShortcut",

  propTypes: {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired,
    catalogMember: PropTypes.object.isRequired,
    glyph: PropTypes.string.isRequired,
    title: PropTypes.string
  },

  async handleClick() {
    if (defined(this.props.catalogMember)) {
      (
        await this.props.viewState.viewCatalogMember(this.props.catalogMember)
      ).raiseError(this.props.terria);
    }
  },

  render() {
    let title = "";
    if (defined(this.props.title)) {
      title = this.props.title;
    } else if (defined(this.props.catalogMember.name)) {
      title = this.props.catalogMember.name;
    }

    return (
      <div className={Styles.toolButton}>
        <button
          type="button"
          className={Styles.btn}
          title={title}
          onClick={this.handleClick}
        >
          <Icon glyph={this.props.glyph} />
        </button>
      </div>
    );
  }
});

export default CatalogShortcut;
