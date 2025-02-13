import CatalogMemberMixin, {
  getName
} from "../../../../../ModelMixins/CatalogMemberMixin";
import DiscretelyTimeVaryingMixin from "../../../../../ModelMixins/DiscretelyTimeVaryingMixin";
import MappableMixin from "../../../../../ModelMixins/MappableMixin";
import { BaseModel } from "../../../../../Models/Definition/Model";
import SelectableDimensions, {
  DEFAULT_PLACEMENT,
  filterSelectableDimensions,
  findSelectedValueName,
  isGroup
} from "../../../../../Models/SelectableDimensions/SelectableDimensions";
import Workbench from "../../../../../Models/Workbench";
import Legend from "../../../../Workbench/Controls/Legend";

interface Props {
  workbench: Workbench;
}

const renderDisplayVariables = (catalogItem: BaseModel) => {
  if (SelectableDimensions.is(catalogItem)) {
    return filterSelectableDimensions(DEFAULT_PLACEMENT)(
      catalogItem.selectableDimensions
    ).map((dim, key) =>
      !isGroup(dim) ? (
        <div key={key}>
          {dim.name}: {findSelectedValueName(dim)}
        </div>
      ) : null
    );
  }
  return null;
};

const renderLegend = (catalogItem: BaseModel) => {
  if (!MappableMixin.isMixedInto(catalogItem)) {
    return null;
  }

  return (
    <div key={catalogItem.uniqueId} className="layer-legends">
      <div className="layer-title">{getName(catalogItem)}</div>
      {DiscretelyTimeVaryingMixin.isMixedInto(catalogItem) && (
        <div className="layer-time">Time: {catalogItem.currentTime}</div>
      )}
      {CatalogMemberMixin.isMixedInto(catalogItem) && (
        <Legend forPrint item={catalogItem} />
      )}
    </div>
  );
};

const WorkbenchItem = ({ item }: { item: BaseModel }) => {
  return (
    <div className="WorkbenchItem">
      <h3>{getName(item)}</h3>
      {renderDisplayVariables(item)}
      <div>{renderLegend(item)}</div>
    </div>
  );
};

const PrintWorkbench = (props: Props) => {
  return (
    <>
      {props.workbench.items.map((item, index) => (
        <WorkbenchItem item={item} key={index} />
      ))}
    </>
  );
};

export default PrintWorkbench;
