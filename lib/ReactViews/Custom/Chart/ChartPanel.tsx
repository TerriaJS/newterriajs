import { action } from "mobx";
import { observer } from "mobx-react";
import { FC, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ChartView from "../../../Charts/ChartView";
import Result from "../../../Core/Result";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import Icon from "../../../Styled/Icon";
import { useViewState } from "../../Context";
import Loader from "../../Loader";
import { BottomDockChart } from "./BottomDockChart";
import Styles from "./chart-panel.scss";
import { ChartPanelDownloadButton } from "./ChartPanelDownloadButton";

const height = 300;

interface ChartPanelProps {
  onHeightChange?: () => void;
}

const ChartPanel: FC<ChartPanelProps> = observer(({ onHeightChange }) => {
  const { t } = useTranslation();
  const viewState = useViewState();

  const chartView = useMemo(
    () => new ChartView(viewState.terria),
    [viewState.terria]
  );

  useEffect(() => {
    // Required so that components like the splitter that depend on screen
    // height will re-adjust.
    viewState.triggerResizeEvent();
    if (onHeightChange) {
      onHeightChange();
    }
  }, [onHeightChange, viewState]);

  useEffect(() => {
    // Repaint on every render
    viewState.terria.currentViewer.notifyRepaintRequired();
  });

  const closePanel = action(() => {
    chartView.chartItems.forEach((chartItem) => {
      chartItem.updateIsSelectedInWorkbench(false);
    });
  });

  const chartableCatalogItems = chartView.chartableItems;
  const chartItems = chartView.chartItems.filter((c) => c.showInChartPanel);

  const xAxis = chartView.xAxis!; // Guaranteed by non-empty chartItems with showInChartPanel=true

  const isLoading = false;
  // const isLoading =
  //   chartableItems.length > 0 &&
  //   chartableItems[chartableItems.length - 1].isLoading;

  const chart = useMemo(() => {
    const items = viewState.terria.workbench.items;
    if (items.length === 0) return;

    // Load all items
    Promise.all(
      items
        .filter((item) => MappableMixin.isMixedInto(item))
        .map((item) => item.loadMapItems())
    ).then((results) =>
      Result.combine(results, {
        message: "Failed to load chart items",
        importance: -1
      }).raiseError(viewState.terria)
    );

    return (
      <BottomDockChart
        chartItems={chartItems}
        xAxis={xAxis}
        height={height - 34}
      />
    );
  }, [chartItems, xAxis, viewState.terria]);

  if (chartItems.length === 0) {
    return null;
  }

  return (
    <div className={Styles.holder}>
      <div className={Styles.inner}>
        <div className={Styles.chartPanel} style={{ height: height }}>
          <div>
            <div className={Styles.header}>
              <label className={Styles.sectionLabel}>
                {isLoading ? (
                  <Loader className={Styles.loader} />
                ) : (
                  t("chart.sectionLabel")
                )}
              </label>
              <ChartPanelDownloadButton
                chartableItems={chartableCatalogItems}
              />
              <button
                type="button"
                title={t("chart.closePanel")}
                className={Styles.btnCloseChartPanel}
                onClick={closePanel}
              >
                <Icon glyph={Icon.GLYPHS.close} />
              </button>
            </div>
            <div className={Styles.chart}>{chart}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

ChartPanel.displayName = "ChartPanel";

export default ChartPanel;
