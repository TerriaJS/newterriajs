import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import Styles from "./data-preview.scss";
import { Trans } from "react-i18next";

/**
 * URL section of the preview.
 */
const DataPreviewUrl = createReactClass({
  displayName: "DataPreviewUrl",

  propTypes: {
    metadataItem: PropTypes.object.isRequired
  },

  selectUrl(e) {
    e.target.select();
  },

  render() {
    return (
      <div>
        <h4 className={Styles.h4}>{this.props.metadataItem.typeName} URL</h4>
        {this.props.metadataItem.type === "wms" && (
          <p>
            <Trans i18nKey="description.wms">
              This is a
              <a
                href="https://en.wikipedia.org/wiki/Web_Map_Service"
                target="_blank"
                rel="noopener noreferrer"
              >
                WMS service
              </a>
              , which generates map images on request. It can be used in GIS
              software with this URL:
            </Trans>
          </p>
        )}
        {this.props.metadataItem.type === "wfs" && (
          <p>
            <Trans i18nKey="description.wfs">
              This is a
              <a
                href="https://en.wikipedia.org/wiki/Web_Feature_Service"
                target="_blank"
                rel="noopener noreferrer"
              >
                WFS service
              </a>
              , which transfers raw spatial data on request. It can be used in
              GIS software with this URL:
            </Trans>
          </p>
        )}
        <input
          readOnly
          className={Styles.field}
          type="text"
          value={this.props.metadataItem.url}
          onClick={this.selectUrl}
        />
        {(this.props.metadataItem.type === "wms" ||
          (this.props.metadataItem.type === "esri-mapServer" &&
            this.props.metadataItem.layers)) && (
          <p>
            Layer name
            {this.props.metadataItem.layers.split(",").length > 1
              ? "s"
              : ""}: {this.props.metadataItem.layers}
          </p>
        )}
        {this.props.metadataItem.type === "wfs" && (
          <p>
            Type name
            {this.props.metadataItem.typeNames.split(",").length > 1 ? "s" : ""}
            : {this.props.metadataItem.typeNames}
          </p>
        )}
      </div>
    );
  }
});

export default DataPreviewUrl;
