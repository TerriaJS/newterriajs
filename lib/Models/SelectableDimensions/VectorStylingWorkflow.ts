import { computed } from "mobx";
import filterOutUndefined from "../../Core/filterOutUndefined";
import GeoJsonMixin from "../../ModelMixins/GeojsonMixin";
import { SelectableDimension } from "./SelectableDimensions";
import TableStylingWorkflow from "./TableStylingWorkflow";

export default class VectorStylingWorkflow extends TableStylingWorkflow {
  constructor(readonly item: GeoJsonMixin.Instance) {
    super(item);
  }

  @computed get selectableDimensions(): SelectableDimension[] {
    return filterOutUndefined([
      ...super.selectableDimensions,
      this.item.featureCounts.point > 0
        ? ({
            type: "group",
            id: "Point size",
            selectableDimensions: [
              {
                type: "select",
                id: "marker-size",
                options: [
                  { id: "small", name: "Small" },
                  { id: "medium", name: "Medium" },
                  { id: "large", name: "Large" }
                ],
                undefinedLabel: "Other",
                selectedId: this.item.style["marker-size"] ?? "small",
                setDimensionValue: (stratumId, id) => {
                  this.item.style.setTrait(stratumId, "marker-size", id);
                }
              }
            ]
          } as SelectableDimension)
        : undefined,
      {
        type: "group",
        id: "Stroke",
        selectableDimensions: filterOutUndefined([
          this.item.featureCounts.point > 0 ||
          this.item.featureCounts.polygon > 0
            ? {
                type: "select",
                id: "Color",
                name: "Color",
                options: [{ id: "White" }, { id: "Black" }],
                selectedId:
                  this.item.stylesWithDefaults.stroke.toCssHexString() ===
                  "#ffffff"
                    ? "White"
                    : this.item.stylesWithDefaults.stroke.toCssHexString() ===
                      "#000000"
                    ? "Black"
                    : undefined,
                undefinedLabel: "Other",
                setDimensionValue: (stratumId, id) => {
                  this.item.style.setTrait(
                    stratumId,
                    "stroke",
                    id === "White" ? "#ffffff" : "#000000"
                  );
                }
              }
            : undefined,
          {
            type: "numeric",
            id: "Width",
            name: "Width",
            value: Math.max(
              this.item.stylesWithDefaults.polylineStrokeWidth,
              this.item.stylesWithDefaults.polygonStrokeWidth,
              this.item.stylesWithDefaults.markerStrokeWidth
            ),
            setDimensionValue: (stratumId, value) => {
              this.item.style.setTrait(stratumId, "marker-stroke-width", value);
              this.item.style.setTrait(
                stratumId,
                "polygon-stroke-width",
                value
              );
              this.item.style.setTrait(
                stratumId,
                "polyline-stroke-width",
                value
              );
            }
          }
        ])
      }
    ]);
  }
}
