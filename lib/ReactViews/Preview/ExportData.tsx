import { Component } from "react";

import { withTranslation, WithTranslation } from "react-i18next";

import Styles from "./mappable-preview.scss";
import { observer } from "mobx-react";

import isDefined from "../../Core/isDefined";
import ExportableMixin from "../../ModelMixins/ExportableMixin";
import FileSaver from "file-saver";

interface PropsType extends WithTranslation {
  item: ExportableMixin.Instance;
}

export async function exportData(item: ExportableMixin.Instance) {
  const data = await item.exportData();
  if (!isDefined(data)) {
    return;
  }
  if (typeof data === "string") {
    window.open(data);
  } else if ("file" in data && "name" in data) {
    FileSaver.saveAs(data.file, data.name);
  }
}

/**
 * CatalogItem ExportData.
 */
@observer
class ExportData extends Component<PropsType> {
  exportDataClicked(item: ExportableMixin.Instance) {
    exportData(item).catch((e) => {
      this.props.item.terria.raiseErrorToUser(e);
    });
  }

  render() {
    const catalogItem = this.props.item;

    if (
      !catalogItem ||
      !ExportableMixin.isMixedInto(catalogItem) ||
      !catalogItem.canExportData
    )
      return null;

    return (
      <div className={Styles.metadata}>
        <button onClick={this.exportDataClicked.bind(this, catalogItem)}>
          Export data
        </button>
      </div>
    );
  }
}
export default withTranslation()(ExportData);
