import { observer } from "mobx-react";
import { FC, Fragment } from "react";
import ChartView from "../../Charts/ChartView";
import filterOutUndefined from "../../Core/filterOutUndefined";
import hasTraits from "../../Models/Definition/hasTraits";
import Terria from "../../Models/Terria";
import ViewState from "../../ReactViewModels/ViewState";
import DiscretelyTimeVaryingTraits from "../../Traits/TraitsClasses/DiscretelyTimeVaryingTraits";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";

interface ChartDisclaimerProps {
  terria: Terria;
  viewState: ViewState;
}

const ChartDisclaimer: FC<ChartDisclaimerProps> = ({ terria }) => {
  const chartView = new ChartView(terria);

  const uniqueChartDisclaimers: string[] = [
    ...new Set(
      filterOutUndefined(
        chartView.chartItems.map((chartItem) =>
          chartItem.showInChartPanel &&
          hasTraits(
            chartItem.item,
            DiscretelyTimeVaryingTraits,
            "chartDisclaimer"
          )
            ? chartItem.item.chartDisclaimer
            : undefined
        )
      )
    )
  ];

  if (uniqueChartDisclaimers.length === 0) return null;

  return (
    <Box
      backgroundColor="#9a4b4b"
      column
      paddedHorizontally={2}
      css={`
        a,
        a:visited {
          color: white;
        }
      `}
    >
      <Spacing bottom={2} />
      {uniqueChartDisclaimers.map((chartDisclaimer) => (
        <Fragment key={chartDisclaimer}>
          <Text textLight>{parseCustomHtmlToReact(chartDisclaimer!)}</Text>
          <Spacing bottom={2} />
        </Fragment>
      ))}
    </Box>
  );
};

export default observer(ChartDisclaimer);
