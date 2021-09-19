import { Component } from "react";
import PropTypes from "prop-types";
import Sortable from "react-anything-sortable";

import WorkbenchSplitScreen from "./WorkbenchSplitScreen";
import WorkbenchItem from "./WorkbenchItem";
import { observer } from "mobx-react";
import { action } from "mobx";

import Styles from "./workbench-list.scss";
import "!!style-loader!css-loader?sourceMap!./sortable.css";

@observer
class WorkbenchList extends Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    viewState: PropTypes.object.isRequired
  };

  @action.bound
  onSort(sortedArray, currentDraggingSortData, currentDraggingIndex) {
    this.props.terria.workbench.moveItemToIndex(
      currentDraggingSortData,
      currentDraggingIndex
    );
  }

  render() {
    return (
      <ul className={Styles.workbenchContent}>
        {this.props.terria.showSplitter && (
          <WorkbenchSplitScreen terria={this.props.terria} />
        )}
        <Sortable onSort={this.onSort} direction="vertical" dynamic={true}>
          <For each="item" of={this.props.terria.workbench.items}>
            <WorkbenchItem
              item={item}
              sortData={item}
              key={item.uniqueId}
              viewState={this.props.viewState}
            />
          </For>
        </Sortable>
      </ul>
    );
  }
}

module.exports = WorkbenchList;
