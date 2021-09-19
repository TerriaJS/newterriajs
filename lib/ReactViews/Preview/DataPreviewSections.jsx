import createReactClass from "create-react-class";
import naturalSort from "javascript-natural-sort";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import Mustache from "mustache";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import isDefined from "../../Core/isDefined";
import CommonStrata from "../../Models/Definition/CommonStrata";
import Box from "../../Styled/Box";
import { item } from "../Custom/Chart/tooltip.scss";
import Collapsible from "../Custom/Collapsible/Collapsible";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import MetadataTable from "./MetadataTable";

naturalSort.insensitive = true;

Mustache.escape = function(string) {
  return string;
};

/**
 * CatalogItem-defined sections that sit within the preview description. These are ordered according to the catalog item's
 * order if available.
 */
const DataPreviewSections = observer(
  createReactClass({
    displayName: "DataPreviewSections",

    propTypes: {
      metadataItem: PropTypes.object.isRequired,
      t: PropTypes.func.isRequired
    },

    sortInfoSections(items) {
      const infoSectionOrder = this.props.metadataItem.infoSectionOrder;

      items.sort(function(a, b) {
        const aIndex = infoSectionOrder.indexOf(a.name);
        const bIndex = infoSectionOrder.indexOf(b.name);
        if (aIndex >= 0 && bIndex < 0) {
          return -1;
        } else if (aIndex < 0 && bIndex >= 0) {
          return 1;
        } else if (aIndex < 0 && bIndex < 0) {
          return naturalSort(a.name, b.name);
        }
        return aIndex - bIndex;
      });

      return items.filter(
        item =>
          isDefined(item.content ?? item.contentAsObject) &&
          (item.content ?? item.contentAsObject) !== null &&
          item.content !== ""
      );
    },

    clickInfoSection(reportName, isOpen) {
      const info = this.props.metadataItem.info;
      const clickedInfo = info.find(report => report.name === reportName);

      if (isDefined(clickedInfo)) {
        runInAction(() => {
          clickedInfo.setTrait(CommonStrata.user, "show", isOpen);
        });
      }
      return false;
    },

    render() {
      const metadataItem = this.props.metadataItem;
      const items = metadataItem.hideSource
        ? metadataItem.infoWithoutSources
        : metadataItem.info.slice();

      const renderSection = item => {
        let content = item.content;
        try {
          content = Mustache.render(content, metadataItem);
        } catch (error) {
          console.log(
            `FAILED to parse info section ${item.name} for ${metadataItem.name}`
          );
          console.log(error);
        }
        return parseCustomMarkdownToReact(content, {
          catalogItem: metadataItem
        });
      };

      return (
        <div>
          <For each="item" index="i" of={this.sortInfoSections(items)}>
            <Box paddedVertically displayInlineBlock fullWidth key={i}>
              <Collapsible
                key={i}
                light={false}
                title={item.name}
                isOpen={item.show}
                onToggle={show =>
                  this.clickInfoSection.bind(this, item.name, show)()
                }
                bodyTextProps={{ medium: true }}
              >
                <Choose>
                  <When condition={item.content?.length > 0}>
                    {renderSection(item)}
                  </When>
                  <When condition={item.contentAsObject !== undefined}>
                    <Box paddedVertically={3} fullWidth>
                      <MetadataTable metadataItem={item.contentAsObject} />
                    </Box>
                  </When>
                </Choose>
              </Collapsible>
            </Box>
          </For>
        </div>
      );
    }
  })
);

export default withTranslation()(DataPreviewSections);
