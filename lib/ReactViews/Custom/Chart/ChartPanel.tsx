import { computed, makeObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { type TFunction, withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import ChartView from "../../../Charts/ChartView";
import Result from "../../../Core/Result";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import Icon from "../../../Styled/Icon";
import Loader from "../../Loader";
import Chart from "./BottomDockChart";
import Styles from "./chart-panel.scss";
import { ChartPanelDownloadButton } from "./ChartPanelDownloadButton";
import type Terria from "../../../Models/Terria";
import ViewState from "../../../ReactViewModels/ViewState";

interface ChartPanelProps {
  terria: Terria;
  onHeightChange?: any; // func
  viewState: ViewState;
  animationDuration?: number;
  t: TFunction;
}

const height = 300;

@observer
class ChartPanel extends React.Component<ChartPanelProps> {
  static displayName = "ChartPanel";

  constructor(props: ChartPanelProps) {
    super(props);
    makeObservable(this);
  }

  @computed
  get chartView() {
    return new ChartView(this.props.terria);
  }

  closePanel() {
    this.chartView.chartItems.forEach((chartItem) => {
      chartItem.updateIsSelectedInWorkbench(false);
    });
  }

  componentDidUpdate() {
    // Required so that components like the splitter that depend on screen
    // height will re-adjust.
    this.props.viewState.triggerResizeEvent();
    if (defined(this.props.onHeightChange)) {
      this.props.onHeightChange();
    }
  }

  render() {
    const chartableCatalogItems = this.chartView.chartableItems;
    const chartItems = this.chartView.chartItems.filter(
      (c) => c.showInChartPanel
    );
    this.props.terria.currentViewer.notifyRepaintRequired();
    if (chartItems.length === 0) {
      return null;
    }

    const isLoading = false;
    // const isLoading =
    //   chartableItems.length > 0 &&
    //   chartableItems[chartableItems.length - 1].isLoading;

    let loader;
    let chart;
    if (isLoading) {
      loader = <Loader className={Styles.loader} />;
    }
    const items = this.props.terria.workbench.items;
    if (items.length > 0) {
      // Load all items
      Promise.all(
        items
          .filter((item) => MappableMixin.isMixedInto(item))
          .map((item: any) => item.loadMapItems())
      ).then((results) =>
        Result.combine(results, {
          message: "Failed to load chart items",
          importance: -1
        }).raiseError(this.props.terria)
      );

      chart = (
        <Chart
          terria={this.props.terria}
          chartItems={chartItems}
          xAxis={this.chartView.xAxis}
          height={height - 34}
        />
      );
    }
    const { t } = this.props;
    return (
      <div className={Styles.holder}>
        <div className={Styles.inner}>
          <div className={Styles.chartPanel} style={{ height: height }}>
            <div // @ts-expect-error No Styles.body defined.
              className={Styles.body}
            >
              <div className={Styles.header}>
                <label className={Styles.sectionLabel}>
                  {loader || t("chart.sectionLabel")}
                </label>
                <ChartPanelDownloadButton
                  chartableItems={chartableCatalogItems}
                />
                <button
                  type="button"
                  title={t("chart.closePanel")}
                  className={Styles.btnCloseChartPanel}
                  onClick={() => this.closePanel()}
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
  }
}

export default withTranslation()(ChartPanel);
