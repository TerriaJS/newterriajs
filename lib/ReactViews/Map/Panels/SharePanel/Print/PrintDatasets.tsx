import { getName } from "../../../../../ModelMixins/CatalogMemberMixin";
import { BaseModel } from "../../../../../Models/Definition/Model";
import Description from "../../../../Preview/Description";

interface Props {
  items: readonly BaseModel[];
}

const PrintDatasets = (props: Props) => {
  return (
    <>
      {props.items.map((item, index) => (
        <details key={index} open>
          <summary>{getName(item)}</summary>
          <Description item={item} printView key={index} />
        </details>
      ))}
    </>
  );
};

export default PrintDatasets;
