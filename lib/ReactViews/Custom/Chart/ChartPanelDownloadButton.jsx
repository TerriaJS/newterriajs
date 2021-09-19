"use strict";
import createReactClass from "create-react-class";
import FileSaver from "file-saver";
import PropTypes from "prop-types";
import FeatureDetection from "terriajs-cesium/Source/Core/FeatureDetection";
import Result from "../../../Core/Result";
import VarType from "../../../Map/VarType";
import Icon from "../../../Styled/Icon";
import Styles from "./chart-panel-download-button.scss";

const ChartPanelDownloadButton = createReactClass({
  displayName: "ChartPanelDownloadButton",

  propTypes: {
    chartableItems: PropTypes.array.isRequired
  },

  /**
   * Extracts column names and row data for CSV download.
   * @param {CatalogItem[]} chartableItems
   * @returns { values, names } where values is an array of array rows, corresponding to the column names.
   */
  synthesizeNameAndValueArrays(chartableItems) {
    const valueArrays = [];
    const names = []; // We will add the catalog item name back into the csv column name.

    for (let i = chartableItems.length - 1; i >= 0; i--) {
      const item = chartableItems[i];
      const xColumn = item.xColumn;
      if (!xColumn) {
        continue;
      }
      if (!names.length) {
        names.push(xColumn.name);
      }

      let columns = [xColumn];
      const yColumns = item.yColumns;
      if (yColumns.length > 0) {
        columns = columns.concat(yColumns);
        // Use typed array if possible so we can pass by pointer to the web worker.
        // Create a new array otherwise because if values are a knockout observable, they cannot be serialised for the web worker.
        valueArrays.push(
          columns.map(column =>
            column.type === VarType.SCALAR
              ? new Float32Array(column.values)
              : Array.prototype.slice.call(column.values)
          )
        );
        yColumns.forEach(column => {
          names.push(item.name + " " + column.name);
        });
      }
    }
    return { values: valueArrays, names: names };
  },

  isDownloadSupported() {
    return (
      FeatureDetection.supportsTypedArrays() &&
      FeatureDetection.supportsWebWorkers()
    );
  },

  async download() {
    if (!this.isDownloadSupported()) {
      return;
    }

    const items = this.props.chartableItems;

    if (items.length === 0) return;

    const loadMapResults = Result.combine(
      await Promise.all(items.map(model => model.loadMapItems())),
      "Failed to load catalog items"
    );

    if (loadMapResults.error) {
      loadMapResults.raiseError(
        items[0].terria,
        "Could not download chart data"
      );
    }

    const synthesized = this.synthesizeNameAndValueArrays(
      items.filter(item => item !== undefined)
    );
    // Could implement this using TaskProcessor, but requires webpack magic.
    const HrefWorker = require("worker-loader!./downloadHrefWorker");
    const worker = new HrefWorker();
    // console.log('names and value arrays', synthesized.names, synthesized.values);
    if (synthesized.values && synthesized.values.length > 0) {
      worker.postMessage(synthesized);
      worker.onmessage = event => {
        // console.log('got worker message', event.data.slice(0, 60), '...');
        const blob = new Blob([event.data], {
          type: "text/csv;charset=utf-8"
        });
        FileSaver.saveAs(blob, "chart data.csv");
      };
    }
  },

  render() {
    if (!this.isDownloadSupported()) {
      return null;
    }

    return (
      <button className={Styles.btnDownload} onClick={this.download}>
        <Icon glyph={Icon.GLYPHS.download} />
        Download
      </button>
    );
  }
});

module.exports = ChartPanelDownloadButton;
