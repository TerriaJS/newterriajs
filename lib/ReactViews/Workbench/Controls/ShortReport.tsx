import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import isDefined from "../../../Core/isDefined";
import CatalogMemberMixin from "../../../ModelMixins/CatalogMemberMixin";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import Box from "../../../Styled/Box";
import Spacing from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";
import Collapsible from "../../Custom/Collapsible/Collapsible";
import parseCustomMarkdownToReact from "../../Custom/parseCustomMarkdownToReact";
import { BaseModel } from "../../../Models/Definition/Model";

@observer
export default class ShortReport extends React.Component<{
  item: BaseModel;
}> {
  clickShortReport(
    item: CatalogMemberMixin.Instance,
    reportName: string | undefined,
    isOpen: boolean
  ) {
    const shortReportSections = item.shortReportSections;
    const clickedReport = shortReportSections.find(
      (report) => report.name === reportName
    );

    if (isDefined(clickedReport)) {
      runInAction(() => {
        /**
         * Ensure short report order is reflected by all strata up to this point
         * & replicate all onto user stratum so that toggling doesn't re-order
         * reports - a stopgap for the lack of consistent behavior surrounding
         * removals / re-ordering of objectArrayTraits
         */
        shortReportSections.forEach((report) =>
          report.setTrait(CommonStrata.user, "show", report.show)
        );
        clickedReport.setTrait(CommonStrata.user, "show", isOpen);
      });
    }
    return false;
  }

  render() {
    if (!CatalogMemberMixin.isMixedInto(this.props.item)) return null;

    const item = this.props.item;

    const shortReportSections = item.shortReportSections?.filter((r) =>
      isDefined(r.name)
    );

    if (
      (!isDefined(item.shortReport) || item.shortReport === "") &&
      (!isDefined(shortReportSections) || shortReportSections.length === 0)
    ) {
      return null;
    }

    return (
      <Box fullWidth displayInlineBlock>
        {/* Show shortReport */}
        {isDefined(item.shortReport) && (
          <Text textGreyLighter medium>
            {parseCustomMarkdownToReact(item.shortReport, {
              catalogItem: item
            })}
          </Text>
        )}

        {/** Show shortReportSections
         * use `Collapsible` if `content` is defined, otherwise just use `name`
         */}
        {shortReportSections
          .filter((r) => r.name)
          .map((r, i) => (
            <React.Fragment key={r.name}>
              {r.content ? (
                <Collapsible
                  title={r.name!}
                  isOpen={r.show}
                  onToggle={(show) => this.clickShortReport(item, r.name, show)}
                >
                  {parseCustomMarkdownToReact(r.content!, {
                    catalogItem: item
                  })}
                </Collapsible>
              ) : (
                <Text textGreyLighter medium>
                  {parseCustomMarkdownToReact(r.name!, {
                    catalogItem: item
                  })}
                </Text>
              )}

              {i < shortReportSections.length - 1 && <Spacing bottom={2} />}
            </React.Fragment>
          ))}
      </Box>
    );
  }
}
