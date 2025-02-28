import { Component } from "react";
import { withTranslation, TFunction } from "react-i18next";
import DataUri from "../../Core/DataUri";
import filterOutUndefined from "../../Core/filterOutUndefined";
import JsonValue, { JsonObject } from "../../Core/Json";
import ViewState from "../../ReactViewModels/ViewState";
import Icon from "../../Styled/Icon";
import { withViewState } from "../Context";
import Styles from "./feature-info-download.scss";
import Dropdown from "../Generic/Dropdown";

class FeatureInfoDownload extends Component<{
  data: JsonObject;
  name: string;
  viewState: ViewState;
  t: TFunction;
}> {
  getLinks() {
    const csv = generateCsvData(this.props.data);
    return filterOutUndefined([
      csv
        ? {
            href: DataUri.make("csv", csv),
            download: `${this.props.name}.csv`,
            label: "CSV"
          }
        : undefined,
      {
        href: DataUri.make("json", JSON.stringify(this.props.data)),
        download: `${this.props.name}.json`,
        label: "JSON"
      }
    ]);
  }

  render() {
    const { t } = this.props;
    const links = this.getLinks();

    const icon = (
      <span className={Styles.iconDownload}>
        <Icon glyph={Icon.GLYPHS.opened} />
      </span>
    );

    return (
      <Dropdown
        options={links}
        textProperty="label"
        theme={{
          dropdown: Styles.download,
          list: Styles.dropdownList,
          button: Styles.dropdownButton,
          icon: icon
        }}
      >
        {t("featureInfo.download")}
      </Dropdown>
    );
  }
}

/**
 * Turns a 2-dimensional javascript object into a CSV string, with the first row being the property names and the second
 * row being the data. If the object is too hierarchical to be made into a CSV, returns undefined.
 */
function generateCsvData(data: JsonObject) {
  const row1 = [];
  const row2 = [];
  const keys = Object.keys(data);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const type = typeof data[key];

    // If data is too hierarchical to fit in a table, just return undefined as we can't generate a CSV.
    if (type === "object" && data[key] !== null) {
      // covers both objects and arrays.
      return;
    }
    if (type === "function") {
      // Ignore template functions we may add.
      continue;
    }

    row1.push(makeSafeForCsv(key));
    row2.push(makeSafeForCsv(data[key]));
  }

  return row1.join(",") + "\n" + row2.join(",");
}

/**
 * Makes a string safe for insertion into a CSV by wrapping it in inverted commas (") and changing inverted commas within
 * it to double-inverted-commas ("") as per CSV convention.
 */
function makeSafeForCsv(value: JsonValue) {
  value = value ? `${value}` : "";

  return '"' + value.replace(/"/g, '""') + '"';
}

export default withTranslation()(withViewState(FeatureInfoDownload));
