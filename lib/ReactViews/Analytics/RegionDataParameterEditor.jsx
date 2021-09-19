import createReactClass from "create-react-class";

import PropTypes from "prop-types";

import defined from "terriajs-cesium/Source/Core/defined";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import VarType from "../../Map/VarType";
import CatalogItem from "../DataCatalog/CatalogItem";
import CatalogGroup from "../DataCatalog/CatalogGroup";

import Styles from "./parameter-editors.scss";
import CommonStrata from "../../Models/Definition/CommonStrata";

const RegionDataParameterEditor = createReactClass({
  displayName: "RegionDataParameterEditor",

  propTypes: {
    previewed: PropTypes.object,
    parameter: PropTypes.object
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this.catalogItemDetails = {};
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.catalogItemDetails = {};
  },

  getValue() {
    return this.props.parameter.value;
  },

  setValue(value) {
    this.props.parameter.setValue(CommonStrata.user, value);
  },

  regionProvider() {
    return this.props.parameter.regionProvider;
  },

  catalogItemsWithMatchingRegion() {
    return this.props.parameter.getEnabledItemsWithMatchingRegionType();
  },

  toggleActive(catalogItem, column) {
    const value = this.getValue();
    const newValue = !this.isActive(catalogItem, column);

    if (newValue) {
      value[column.name] = {
        regionProvider: this.regionProvider(),
        regionColumn: catalogItem.regionMapping.tableStructure.getColumnWithNameOrId(
          catalogItem.regionMapping.regionDetails[0].columnName
        ),
        valueColumn: column
      };

      // If only one dataset can be active at a time, deactivate all others.
      if (this.props.parameter.singleSelect) {
        for (const columnName in value) {
          if (
            Object.prototype.hasOwnProperty.call(value, columnName) &&
            columnName !== column.name
          ) {
            value[columnName] = false;
          }
        }
      }
    } else {
      value[column.name] = false;
      this.getCatalogItemDetails(
        this.catalogItemDetails,
        catalogItem
      ).isEntirelyActive = false;
    }
  },

  isActive(catalogItem, column) {
    let value = this.getValue();

    if (!defined(value)) {
      value = {};
      this.setValue(value);
    }

    if (!defined(value[column.name])) {
      value[column.name] = false;
      knockout.track(value, [column.name]);

      if (
        !this.props.parameter.singleSelect ||
        Object.keys(value).length === 1
      ) {
        value[column.name] = {
          regionProvider: this.regionProvider(),
          regionColumn: catalogItem.regionMapping.tableStructure.getColumnWithNameOrId(
            catalogItem.regionMapping.regionDetails[0].columnName
          ),
          valueColumn: column
        };
      }
    }

    return (
      defined(value[column.name]) &&
      value[column.name] &&
      value[column.name].regionColumn ===
        catalogItem.regionMapping.tableStructure.getColumnWithNameOrId(
          catalogItem.regionMapping.regionDetails[0].columnName
        ) &&
      value[column.name].valueColumn === column
    );
  },

  getCatalogItemDetails(catalogItemDetails, catalogItem) {
    if (!defined(catalogItemDetails[catalogItem.uniqueId])) {
      catalogItemDetails[catalogItem.uniqueId] = {
        isOpen: true,
        isEntirelyActive: true
      };
      knockout.track(catalogItemDetails, [catalogItem.uniqueId]);
      knockout.track(catalogItemDetails[catalogItem.uniqueId], [
        "isOpen",
        "isEntirelyActive"
      ]);
    }

    return catalogItemDetails[catalogItem.uniqueId];
  },

  toggleEntireCatalogItem(catalogItem) {
    const details = this.getCatalogItemDetails(
      this.catalogItemDetails,
      catalogItem
    );
    details.isEntirelyActive = !details.isEntirelyActive;

    const columns = catalogItem.regionMapping.tableStructure.columns;
    for (let i = 0; i < columns.length; ++i) {
      const column = columns[i];
      if (this.columnIsScalar(catalogItem, column)) {
        const isActive = this.isActive(catalogItem, column);
        if (
          (!isActive && details.isEntirelyActive) ||
          (isActive && !details.isEntirelyActive)
        ) {
          this.toggleActive(catalogItem, column);
        }
      }
    }
  },

  catalogItemIsOpen(catalogItem) {
    const details = this.getCatalogItemDetails(
      this.catalogItemDetails,
      catalogItem
    );
    return details.isOpen;
  },

  toggleOpenCatalogItem(catalogItem) {
    const details = this.getCatalogItemDetails(
      this.catalogItemDetails,
      catalogItem
    );
    details.isOpen = !details.isOpen;
  },

  isEntireCatalogItemActive(catalogItem) {
    const details = this.getCatalogItemDetails(
      this.catalogItemDetails,
      catalogItem
    );
    return details.isEntirelyActive;
  },

  render() {
    return <div className={Styles.parameterEditor}>{this.renderContent()}</div>;
  },

  renderContent() {
    if (this.catalogItemsWithMatchingRegion().length > 0) {
      return (
        <div className={Styles.data}>
          <ul className={Styles.tree}>
            <For
              each="catalogItem"
              index="i"
              of={this.catalogItemsWithMatchingRegion()}
            >
              <CatalogGroup
                key={catalogItem.uniqueId}
                text={catalogItem.name}
                topLevel={false}
                open={this.catalogItemIsOpen(catalogItem)}
                onClick={this.toggleOpenCatalogItem.bind(this, catalogItem)}
                loading={false}
              >
                {this.renderItemChildren(catalogItem)}
              </CatalogGroup>
            </For>
          </ul>
        </div>
      );
    }
    return (
      // Don't break the lines around the link to csv-geo-au, or whitespace stripping will ruin the formatting in
      // the rendered version.
      <div className={Styles.parameterEditorImportantNote}>
        No characteristics are available because you have not added any data to
        the map for this region type,{" "}
        {this.regionProvider() ? this.regionProvider().regionType : "None"}. You
        may use your own data with this analysis by creating a CSV following the{" "}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/TerriaJS/nationalmap/wiki/csv-geo-au"
        >
          csv-geo-au
        </a>{" "}
        guidelines and dragging and dropping it onto the map.
      </div>
    );
  },

  renderItemChildren(catalogItem) {
    return (
      <ul className={Styles.tree}>
        {catalogItem.regionMapping.tableStructure.columns.map((column, i) => {
          if (column.type === VarType.SCALAR) {
            return (
              <CatalogItem
                key={column.id}
                onTextClick={this.toggleActive.bind(this, catalogItem, column)}
                selected={this.isActive(catalogItem, column)}
                text={column.name}
                onBtnClick={this.toggleActive.bind(this, catalogItem, column)}
                btnState={this.isActive(catalogItem, column) ? "remove" : "add"}
              />
            );
          }
        })}
      </ul>
    );
  }
});
module.exports = RegionDataParameterEditor;
