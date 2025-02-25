import { Tooltip as VisxTooltip } from "@visx/tooltip";
import dateformat from "dateformat";
import groupBy from "lodash-es/groupBy";
import { observer } from "mobx-react";
import { memo, useMemo, useRef, type CSSProperties } from "react";
import { CSSTransition } from "react-transition-group";
import type { ChartPoint } from "../../../Charts/ChartData";
import type { ChartItem } from "../../../ModelMixins/ChartableMixin";
import Styles from "./tooltip.scss";

interface Item {
  chartItem: ChartItem;
  point: ChartPoint;
}

interface TooltipProps {
  items: Item[];
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

const Tooltip: React.FC<TooltipProps> = observer((props) => {
  const prevItems = useRef<Item[]>([]);

  const items = useMemo(() => {
    const propItems = props.items;
    if (propItems && propItems.length > 0) {
      prevItems.current = propItems;
      return propItems;
    } else {
      return prevItems.current;
    }
  }, [props.items]);

  const title = useMemo(() => {
    if (items.length > 0) {
      // derive title from first item x
      const x = items[0].point.x;
      return x instanceof Date ? dateformat(x, "dd/mm/yyyy, HH:MMTT") : x;
    } else return undefined;
  }, [items]);

  const groups = useMemo(() => {
    // momentLines and momentPoints are not shown in the tooltip body
    const tooltipItems = items.filter(
      ({ chartItem }) =>
        chartItem.type !== "momentLines" && chartItem.type !== "momentPoints"
    );
    return Object.entries(groupBy(tooltipItems, "chartItem.categoryName")).map(
      (o) => ({
        name: o[0],
        items: o[1]
      })
    );
  }, [items]);

  const style: CSSProperties = useMemo(() => {
    const { left, right, top, bottom } = props;
    return {
      left: left === undefined ? "" : `${left}px`,
      right: right === undefined ? "" : `${right}px`,
      top: top === undefined ? "" : `${top}px`,
      bottom: bottom === undefined ? "" : `${bottom}px`,
      position: "absolute",
      boxShadow: "0 1px 2px rgba(33,33,33,0.2)"
    };
  }, [props]);

  const show = props.items.length > 0;

  return (
    <CSSTransition
      in={show}
      classNames="transition"
      timeout={1000}
      unmountOnExit
    >
      <VisxTooltip className={Styles.tooltip} key={Math.random()} style={style}>
        <div>{title}</div>
        <div>
          {groups.map((group) => (
            <TooltipGroup
              key={`tooltip-group-${group.name}`}
              name={groups.length > 1 ? group.name : undefined}
              items={group.items}
            />
          ))}
        </div>
      </VisxTooltip>
    </CSSTransition>
  );
});

Tooltip.displayName = "Tooltip";

interface TooltipGroupProps {
  name?: string;
  items: Item[];
}

const TooltipGroup = memo(({ name, items }: TooltipGroupProps) => {
  return (
    <div className={Styles.group}>
      {name && <div>{name}</div>}
      {items.map((item) => (
        <TooltipItem key={`tooltipitem-${item.chartItem.key}`} item={item} />
      ))}
    </div>
  );
});

TooltipGroup.displayName = "TooltipGroup";

interface TooltipItemProps {
  item: Item;
}

const TooltipItem: React.FC<TooltipItemProps> = observer(({ item }) => {
  const chartItem = item.chartItem;
  const value = item.point.y;
  const formattedValue = isNaN(value) ? value : value.toFixed(2);
  return (
    <div className={Styles.item}>
      <div
        className={Styles.itemSymbol}
        style={{ backgroundColor: chartItem.getColor() }}
      />
      <div className={Styles.itemName}>{chartItem.name}</div>
      <div className={Styles.itemValue}>{formattedValue}</div>
      <div>{chartItem.units}</div>
    </div>
  );
});

TooltipItem.displayName = "TooltipItem";

export default Tooltip;
