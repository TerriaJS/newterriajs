import ModelTraits from "../../ModelTraits";
import primitiveTrait from "../../Decorators/primitiveTrait";
import primitiveArrayTrait from "../../Decorators/primitiveArrayTrait";
import anyTrait from "../../Decorators/anyTrait";
import { JsonObject } from "../../../Core/Json";
import TableColumnType from "../../../Table/TableColumnType";
import objectTrait from "../../Decorators/objectTrait";

export const THIS_COLUMN_EXPRESSION_TOKEN = "x";

export class ColumnTransformationTraits extends ModelTraits {
  @primitiveTrait({
    name: "Expression",
    description: `Transformation expression used to change column values (row-by-row). This uses http://bugwheels94.github.io/math-expression-evaluator . For example  \`${THIS_COLUMN_EXPRESSION_TOKEN}*3\` will multiply all column values by 3, \`${THIS_COLUMN_EXPRESSION_TOKEN}*columnA\` will multiple this column with \`columnA\` (note - \`columnA\` must be in \`dependencies\` array).`,
    type: "string"
  })
  expression?: string;

  @primitiveArrayTrait({
    name: "Dependencies",
    description: `Array of column names which are 'injected' in to the expression. For example, to use the expression \`${THIS_COLUMN_EXPRESSION_TOKEN}*columnA\` (where \`columnA\` is the name of another column), \`dependencies\` must include \`'columnA'\``,
    type: "string"
  })
  dependencies?: string[];
}

export default class TableColumnTraits extends ModelTraits {
  @primitiveTrait({
    name: "Name",
    description: "The name of the column.",
    type: "string"
  })
  name?: string;

  @primitiveTrait({
    name: "Title",
    description: "The displayed title of the column.",
    type: "string"
  })
  title?: string;

  @primitiveTrait({
    name: "Units",
    description: "The units for the column values.",
    type: "string"
  })
  units?: string;

  @objectTrait({
    name: "Transformation",
    type: ColumnTransformationTraits,
    description: "Transformation to apply to this column"
  })
  transformation?: ColumnTransformationTraits;

  @primitiveTrait({
    name: "Type",
    description:
      "The type of the column. If not specified, the type is guessed from " +
      "the column's name and values. Valid types are:\n\n" +
      Object.keys(TableColumnType)
        .filter((type) => isNaN(Number(type)))
        .map((type) => `  * \`${type}\``)
        .join("\n"),
    type: "string"
  })
  type?: string;

  @primitiveTrait({
    name: "Region Type",
    description:
      "The type of region referenced by the values in this column. If " +
      "`Type` is not defined and this value can be resolved, the column " +
      "`Type` will be `region`.",
    type: "string"
  })
  regionType?: string;

  @primitiveTrait({
    name: "Region Type Disambiguation Column",
    description:
      "The name of the column to use to disambiguate region matches in " +
      "this column.",
    type: "string"
  })
  regionDisambiguationColumn?: string;

  @primitiveArrayTrait({
    name: "Values to Replace with Zero",
    description: "Values of the column to replace with 0.0, such as `-`.",
    type: "string"
  })
  replaceWithZeroValues?: string[];

  @primitiveArrayTrait({
    name: "Values to Replace with Null",
    description: "Values of the column to replace with null, such as `NA`.",
    type: "string"
  })
  replaceWithNullValues?: string[];

  @anyTrait({
    name: "Format",
    description:
      "The formatting options to pass to `toLocaleString` when formatting the values " +
      "of this column for the legend and feature information panels. See:\n" +
      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString\n" +
      "and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat"
  })
  format?: JsonObject;
}
