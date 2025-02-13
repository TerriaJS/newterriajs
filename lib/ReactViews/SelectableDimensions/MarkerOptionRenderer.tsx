import { getMakiIcon } from "../../Map/Icons/Maki/MakiIcons";
import { OptionRenderer } from "../../Models/SelectableDimensions/SelectableDimensions";

export const MarkerOptionRenderer: OptionRenderer = (option) => (
  <div>
    <img
      width="20px"
      height="20px"
      style={{ marginBottom: -5 }}
      src={getMakiIcon(option.value, "#000", 1, "#fff", 24, 24) ?? option.value}
    />{" "}
    {option.value}
  </div>
);
