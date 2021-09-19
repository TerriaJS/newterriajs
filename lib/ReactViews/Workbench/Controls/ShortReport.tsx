"use strict";

import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { Component, Fragment } from "react";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import Box from "../../../Styled/Box";
import Spacing from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";
import Collapsible from "../../Custom/Collapsible/Collapsible";
import parseCustomMarkdownToReact from "../../Custom/parseCustomMarkdownToReact";

@observer
export default class ShortReport extends Component<{
  item: CatalogMemberMixin.Instance;
}> {
  clickShortReport(reportName: string | undefined, isOpen: boolean) {
    const shortReportSections = this.props.item.shortReportSections;
    const clickedReport = shortReportSections.find(
      report => report.name === reportName
    );

    if (isDefined(clickedReport)) {
      runInAction(() => {
        /**
         * Ensure short report order is reflected by all strata up to this point
         * & replicate all onto user stratum so that toggling doesn't re-order
         * reports - a stopgap for the lack of consistent behaviour surrounding
         * removals / re-ordering of objectArrayTraits
         */
        shortReportSections.forEach(report =>
          report.setTrait(CommonStrata.user, "show", report.show)
        );
        clickedReport.setTrait(CommonStrata.user, "show", isOpen);
      });
    }
    return false;
  }

  render() {
    const shortReportSections = this.props.item?.shortReportSections?.filter(
      r => isDefined(r.name)
    );

    if (
      (!isDefined(this.props.item.shortReport) ||
        this.props.item.shortReport === "") &&
      (!isDefined(shortReportSections) || shortReportSections.length === 0)
    ) {
      return null;
    }

    return (
      <Box fullWidth displayInlineBlock padded>
        {/* Show shortReport */}
        {isDefined(this.props.item.shortReport) && (
          <Text textLight medium>
            {parseCustomMarkdownToReact(this.props.item.shortReport, {
              catalogItem: this.props.item
            })}
          </Text>
        )}

        {/* Show shortReportSections */}
        {shortReportSections
          .filter(r => r.content && r.name)
          .map((r, i) => (
            <Fragment key={r.name}>
              <Collapsible
                title={r.name!}
                isOpen={r.show}
                onToggle={show =>
                  this.clickShortReport.bind(this, r.name, show)()
                }
              >
                {parseCustomMarkdownToReact(r.content!, {
                  catalogItem: this.props.item
                })}
              </Collapsible>
              {i < shortReportSections.length - 1 && <Spacing bottom={2} />}
            </Fragment>
          ))}
      </Box>
    );
  }
}

module.exports = ShortReport;
