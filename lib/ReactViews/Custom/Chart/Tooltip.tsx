import { observer } from "mobx-react";
import { computed, makeObservable } from "mobx";
import { Tooltip as VisxTooltip } from "@visx/tooltip";
import { CSSTransition } from "react-transition-group";
import React from "react";
import dateformat from "dateformat";
import groupBy from "lodash-es/groupBy";
import Styles from "./tooltip.scss";

type ItemType = any;

interface TooltipProps {
  items: ItemType[];
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

@observer
class Tooltip extends React.Component<TooltipProps> {
  prevItems: ItemType[] = [];

  constructor(props: TooltipProps) {
    super(props);
    makeObservable(this);
  }

  @computed
  get items() {
    // When items` is unset, hold on to its last value. We do this because we
    // want to keep showing the tooltip. We then fade it out using the
    // CSSTransition below.
    const items = this.props.items;
    if (items && items.length > 0) {
      this.prevItems = items;
      return items;
    } else {
      return this.prevItems;
    }
  }

  @computed
  get title() {
    const items = this.items;
    if (items.length > 0) {
      // derive title from first item x
      const x = items[0].point.x;
      return x instanceof Date ? dateformat(x, "dd/mm/yyyy, HH:MMTT") : x;
    } else return undefined;
  }

  @computed
  get groups() {
    // momentLines and momentPoints are not shown in the tooltip body
    const tooltipItems = this.items.filter(
      ({ chartItem }) =>
        chartItem.type !== "momentLines" && chartItem.type !== "momentPoints"
    );
    return Object.entries(groupBy(tooltipItems, "chartItem.categoryName")).map(
      (o) => ({
        name: o[0],
        items: o[1]
      })
    );
  }

  @computed
  get style() {
    const { left, right, top, bottom } = this.props;
    return {
      left: left === undefined ? "" : `${left}px`,
      right: right === undefined ? "" : `${right}px`,
      top: top === undefined ? "" : `${top}px`,
      bottom: bottom === undefined ? "" : `${bottom}px`,
      position: "absolute",
      boxShadow: "0 1px 2px rgba(33,33,33,0.2)"
    };
  }

  render() {
    const { items } = this.props;
    const show = items.length > 0;
    return (
      <CSSTransition
        in={show}
        classNames="transition"
        timeout={1000}
        unmountOnExit
      >
        <VisxTooltip
          className={Styles.tooltip}
          key={Math.random()}
          // @ts-expect-error position is string, not the expected "Position".
          style={this.style}
        >
          <div // @ts-expect-error Styles.title is not defined.
            className={Styles.title}
          >
            {this.title}
          </div>
          <div>
            {this.groups.map((group) => (
              <TooltipGroup
                key={`tooltip-group-${group.name}`}
                name={this.groups.length > 1 ? group.name : undefined}
                items={group.items}
              />
            ))}
          </div>
        </VisxTooltip>
      </CSSTransition>
    );
  }
}

interface TooltipGroupProps {
  name: string | undefined;
  items: ItemType[];
}

class TooltipGroup extends React.PureComponent<TooltipGroupProps> {
  constructor(props: TooltipGroupProps) {
    super(props);
    makeObservable(this);
  }

  render() {
    const { name, items } = this.props;
    return (
      <div className={Styles.group}>
        {name ? ( // @ts-expect-error Styles.groupName is not defined.
          <div className={Styles.groupName}>{name}</div>
        ) : null}
        {items.map((item) => (
          <TooltipItem key={`tooltipitem-${item.chartItem.key}`} item={item} />
        ))}
      </div>
    );
  }
}

interface TooltipItemProps {
  item: ItemType;
}

@observer
class TooltipItem extends React.Component<TooltipItemProps> {
  constructor(props: TooltipItemProps) {
    super(props);
    makeObservable(this);
  }

  render() {
    const chartItem = this.props.item.chartItem;
    const value = this.props.item.point.y;
    const formattedValue = isNaN(value) ? value : value.toFixed(2);
    return (
      <div className={Styles.item}>
        <div
          className={Styles.itemSymbol}
          style={{ backgroundColor: chartItem.getColor() }}
        />
        <div className={Styles.itemName}>{chartItem.name}</div>
        <div className={Styles.itemValue}>{formattedValue}</div>
        <div // @ts-expect-error Styles.itemUnits is not defined.
          className={Styles.itemUnits}
        >
          {chartItem.units}
        </div>
      </div>
    );
  }
}

export default Tooltip;
