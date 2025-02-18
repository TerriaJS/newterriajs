import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";
import ChartView from "../../../Charts/ChartView";
import ChartableMixin, {
  axesMatch,
  ChartAxis
} from "../../../ModelMixins/ChartableMixin";
import { BaseModel } from "../../../Models/Definition/Model";
import Checkbox from "../../../Styled/Checkbox/Checkbox";
import { Li, Ul } from "../../../Styled/List";
import { TextSpan } from "../../../Styled/Text";

interface IChartItem {
  chartItem: any;
}

interface IChartItemSelector {
  item: BaseModel;
}

export const ChartItem: FC<React.PropsWithChildren<IChartItem>> = observer(
  ({ chartItem }: IChartItem) => {
    const { t } = useTranslation();
    const lineColor = chartItem.isSelectedInWorkbench
      ? chartItem.getColor()
      : "#fff";

    const toggleActive = () => {
      const catalogItem = chartItem.item;
      runInAction(() => {
        const shouldSelect = !chartItem.isSelectedInWorkbench;
        chartItem.updateIsSelectedInWorkbench(shouldSelect);
        if (shouldSelect) {
          unselectChartItemsWithXAxisNotMatching(
            catalogItem.terria.workbench.items,
            chartItem.xAxis
          );
        }
      });
    };

    return (
      <Checkbox
        id="depthTestAgainstTerrain"
        isChecked={chartItem.isSelectedInWorkbench}
        title={t("chart.showItemInChart", { value: chartItem.name })}
        onChange={toggleActive}
        css={`
          color: ${lineColor};
        `}
      >
        <TextSpan>{chartItem.name}</TextSpan>
      </Checkbox>
    );
  }
);

const ChartItemSelector: FC<React.PropsWithChildren<IChartItemSelector>> =
  observer(({ item }: IChartItemSelector) => {
    const theme = useTheme();
    const chartView = new ChartView(item.terria);
    // We don't need to show selectors for moment datasets. They are part of
    // discretelytimevarying items and have a separate chart button to enable/disable.
    const chartItems = chartView.chartItems
      .filter((c) => c.item === item)
      .filter((c) => c.type !== "momentPoints" && c.type !== "momentLines")
      .sort((a, b) => (a.name >= b.name ? 1 : -1));

    if (chartItems && chartItems.length === 0) return null;
    return (
      <Ul
        fullWidth
        spaced
        padded
        column
        rounded
        backgroundColor={theme?.overlay}
        css={`
          margin: 10px 0;
        `}
      >
        {chartItems.map((chartItem) => (
          <Li key={`li-${chartItem.key}`}>
            <ChartItem chartItem={chartItem} />
          </Li>
        ))}
      </Ul>
    );
  });

function unselectChartItemsWithXAxisNotMatching(
  items: BaseModel[],
  requiredAxis: ChartAxis
) {
  items.forEach((item) => {
    if (ChartableMixin.isMixedInto(item)) {
      item.chartItems.forEach((chartItem) => {
        if (!axesMatch(chartItem.xAxis, requiredAxis)) {
          chartItem.updateIsSelectedInWorkbench(false);
        }
      });
    }
  });
}

export default ChartItemSelector;
