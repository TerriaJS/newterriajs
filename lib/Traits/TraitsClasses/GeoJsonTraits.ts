import { JsonObject } from "../../Core/Json";
import anyTrait from "../Decorators/anyTrait";
import objectArrayTrait from "../Decorators/objectArrayTrait";
import objectTrait from "../Decorators/objectTrait";
import primitiveTrait from "../Decorators/primitiveTrait";
import mixTraits from "../mixTraits";
import ModelTraits from "../ModelTraits";
import ClusteringTraits from "./ClusteringTraits";
import FeatureInfoUrlTemplateTraits from "./FeatureInfoTraits";
import LegendOwnerTraits from "./LegendOwnerTraits";
import StyleTraits from "./StyleTraits";
import TableTraits from "./Table/TableTraits";
import UrlTraits from "./UrlTraits";

export class PerPropertyGeoJsonStyleTraits extends ModelTraits {
  @anyTrait({
    name: "Properties",
    description:
      "If the properties of a feature match these properties, then apply the style to that feature"
  })
  properties?: JsonObject;

  @objectTrait({
    name: "Style",
    type: StyleTraits,
    description:
      "Styling rules to apply, following [simplestyle-spec](https://github.com/mapbox/simplestyle-spec)"
  })
  style?: StyleTraits;

  @primitiveTrait({
    name: "Case sensitive",
    type: "boolean",
    description:
      "True if properties should be matched in a case sensitive fashion"
  })
  caseSensitive?: boolean = false;
}

export class GeoJsonTraits extends mixTraits(
  FeatureInfoUrlTemplateTraits,
  LegendOwnerTraits,
  TableTraits,
  UrlTraits
) {
  /** Override TableTraits which aren't applicable to GeoJsonTraits */
  @primitiveTrait({
    name: "Enable manual region mapping (Disabled for GeoJsonTraits)",
    description:
      "If enabled, there will be controls to set region column and region type.",
    type: "boolean"
  })
  enableManualRegionMapping: boolean = false;

  @primitiveTrait({
    name: "Use outline color for line features",
    description:
      "If enabled, TableOutlineStyleTraits will be used to color Line Features, otherwise TableColorStyleTraits will be used.",
    type: "boolean"
  })
  useOutlineColorForLineFeatures?: boolean;

  @objectTrait({
    type: StyleTraits,
    name: "Style",
    description:
      "Styling rules that follow [simplestyle-spec](https://github.com/mapbox/simplestyle-spec). If defined, then `forceCesiumPrimitives` will be true. For styling MVT/protomaps - see `TableStyleTraits`"
  })
  style?: StyleTraits;

  @primitiveTrait({
    type: "boolean",
    name: "Clamp to Ground",
    description:
      "Whether the features in this GeoJSON should be clamped to the terrain surface. If `forceCesiumPrimitives` is false, this will be `true`"
  })
  clampToGround: boolean = true;

  @primitiveTrait({
    type: "boolean",
    name: "Force cesium primitives",
    description:
      "Force rendering GeoJSON features as Cesium primitives. This will be true if you are using `style`, `perPropertyStyles`, `timeProperty`, `heightProperty` or `czmlTemplate`. If undefined, geojson-vt/protomaps will be used. This will be set to true if simplestyle-spec properties are detected in over 50% of GeoJSON features, or if any MultiPoint features are found "
  })
  forceCesiumPrimitives?: boolean;

  @anyTrait({
    name: "Feature filter (by properties)",
    description:
      "Filter GeoJSON features by properties. If the properties of a feature match `filterByProperties`, then show that feature. All other features are hidden"
  })
  filterByProperties?: JsonObject;

  @objectArrayTrait({
    name: "Per property styles",
    type: PerPropertyGeoJsonStyleTraits,
    description:
      "Override feature styles according to their properties. This is only supported for cesium primitives (see `forceCesiumPrimitives`)",
    idProperty: "index"
  })
  perPropertyStyles: PerPropertyGeoJsonStyleTraits[] = [];

  @primitiveTrait({
    name: "Time property",
    type: "string",
    description:
      "The property of each GeoJSON feature that specifies which point in time that feature is associated with. If not specified, it is assumed that the dataset is constant throughout time. This is only supported for cesium primitives (see `forceCesiumPrimitives`). If using geojson-vt styling, use TableTraits instead (see `TableStyleTraits` and `TableTimeStyleTraits`)"
  })
  timeProperty?: string;

  @primitiveTrait({
    name: "Height property",
    type: "string",
    description:
      "The property of each GeoJSON feature that specifies the height. If defined, polygons will be extruded to this property (in meters) above terrain. This is only supported for cesium primitives (see `forceCesiumPrimitives`)"
  })
  heightProperty?: string;

  @anyTrait({
    name: "CZML template",
    description: `CZML template to be used to replace each GeoJSON **Point** and **Polygon/MultiPolygon** feature. Feature coordinates and properties will automatically be applied to CZML packet, so they can be used as references.

    Polygon/MultiPolygon features only support the \`polygon\` CZML packet.

    Point features support all packets except ones which require a \`PositionsList\` (eg \`polygon\`, \`polyline\`, ...)

    If this is defined, \`clampToGround\`, \`style\`, \`perPropertyStyles\`, \`timeProperty\` and \`heightProperty\` will be ignored.

    For example - this will render a cylinder for every point (and use the length and radius feature properties)
      \`\`\`json
      {
        cylinder: {
          length: {
            reference: "#properties.length"
          },
          topRadius: {
            reference: "#properties.radius"
          },
          bottomRadius: {
            reference: "#properties.radius"
          },
          material: {
            solidColor: {
              color: {
                rgba: [0, 200, 0, 20]
              }
            }
          }
        }
      }
      \`\`\`

    For more info see Cesium's CZML docs https://github.com/AnalyticalGraphicsInc/czml-writer/wiki/CZML-Guide

    The following custom properties are supported:
    - \`heightOffset: number\` to offset height values (in m)`
  })
  czmlTemplate?: JsonObject;

  @primitiveTrait({
    type: "boolean",
    name: "Explode MultiPoints",
    description:
      "Replaces `MultiPoint` features with its equivalent `Point` features when `true`. This is useful for example when using Table mode which does not support `MultiPoint` features currently."
  })
  explodeMultiPoints = true;

  @objectTrait({
    type: ClusteringTraits,
    name: "clustering",
    description:
      "Allows to activate the clustering of entities, works only with Cesium as a viewer."
  })
  clustering?: ClusteringTraits;
}
