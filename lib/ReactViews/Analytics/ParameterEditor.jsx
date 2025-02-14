import React from "react";
import createReactClass from "create-react-class";
import PropTypes from "prop-types";
import PointParameterEditor from "./PointParameterEditor";
import LineParameterEditor from "./LineParameterEditor";
import PolygonParameterEditor from "./PolygonParameterEditor";
import RectangleParameterEditor from "./RectangleParameterEditor";
import RegionParameterEditor from "./RegionParameterEditor";
import RegionTypeParameterEditor from "./RegionTypeParameterEditor";
import BooleanParameterEditor from "./BooleanParameterEditor";
import BooleanParameterGroupEditor from "./BooleanParameterGroupEditor";
import DateParameterEditor from "./DateParameterEditor";
import DateTimeParameterEditor from "./DateTimeParameterEditor";
import EnumerationParameterEditor from "./EnumerationParameterEditor";
import GenericParameterEditor from "./GenericParameterEditor";
import NumberParameterEditor from "./NumberParameterEditor";
import GeoJsonParameterEditor from "./GeoJsonParameterEditor";
import defined from "terriajs-cesium/Source/Core/defined";
import Styles from "./parameter-editors.scss";
import InfoParameterEditor from "./InfoParameterEditor";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";

const ParameterEditor = createReactClass({
  displayName: "ParameterEditor",

  propTypes: {
    parameter: PropTypes.object,
    viewState: PropTypes.object,
    previewed: PropTypes.object,
    parameterViewModel: PropTypes.object
  },

  fieldId: new Date().getTime(),

  renderLabel() {
    return (
      <div>
        <label
          key={this.props.parameter.id}
          className={Styles.label}
          htmlFor={this.fieldId + this.props.parameter.type}
        >
          {this.props.parameter.name}
          {this.props.parameter.isRequired && <span> (required)</span>}
        </label>
        {typeof this.props.parameter.description === "string" &&
        this.props.parameter.description !== "" &&
        typeof this.props.parameter.rangeDescription === "string" &&
        this.props.parameter.rangeDescription !== ""
          ? parseCustomMarkdownToReact(
              `${this.props.parameter.description} ${this.props.parameter.rangeDescription}`,
              {
                parameter: this.props.parameter
              }
            )
          : parseCustomMarkdownToReact(this.props.parameter.description, {
              parameter: this.props.parameter
            })}
      </div>
    );
  },

  renderEditor() {
    for (let i = 0; i < ParameterEditor.parameterTypeConverters.length; ++i) {
      const converter = ParameterEditor.parameterTypeConverters[i];

      const editor = converter.parameterTypeToDiv(
        this.props.parameter.type,
        this
      );
      if (defined(editor)) {
        return (
          <div
            style={{
              color: this.props.parameter.isValid ? "inherit" : "#ff0000"
            }}
          >
            {editor}
          </div>
        );
      }
    }
    const genericEditor = ParameterEditor.parameterTypeConverters.filter(
      function (item) {
        return item.id === "generic";
      }
    )[0];
    return genericEditor.parameterTypeToDiv("generic", this);
  },

  render() {
    return (
      <div
        id={this.fieldId + this.props.parameter.type}
        className={Styles.fieldParameterEditor}
      >
        {this.renderEditor()}
      </div>
    );
  }
});

ParameterEditor.parameterTypeConverters = [
  {
    id: "point",
    parameterTypeToDiv: function PointParameterToDiv(type, parameterEditor) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <PointParameterEditor
              previewed={parameterEditor.props.previewed}
              viewState={parameterEditor.props.viewState}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
            />
          </div>
        );
      }
    }
  },
  {
    id: "line",
    parameterTypeToDiv: function LineParameterToDiv(type, parameterEditor) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <LineParameterEditor
              previewed={parameterEditor.props.previewed}
              viewState={parameterEditor.props.viewState}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
            />
          </div>
        );
      }
    }
  },
  {
    id: "rectangle",
    parameterTypeToDiv: function RectangleParameterToDiv(
      type,
      parameterEditor
    ) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <RectangleParameterEditor
              previewed={parameterEditor.props.previewed}
              viewState={parameterEditor.props.viewState}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
            />
          </div>
        );
      }
    }
  },
  {
    id: "polygon",
    parameterTypeToDiv: function PolygonParameterToDiv(type, parameterEditor) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <PolygonParameterEditor
              previewed={parameterEditor.props.previewed}
              viewState={parameterEditor.props.viewState}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
            />
          </div>
        );
      }
    }
  },
  {
    id: "enumeration",
    parameterTypeToDiv: function EnumerationParameterToDiv(
      type,
      parameterEditor
    ) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <EnumerationParameterEditor
              previewed={parameterEditor.props.previewed}
              viewState={parameterEditor.props.viewState}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
            />
          </div>
        );
      }
    }
  },
  {
    id: "date",
    parameterTypeToDiv: function DateParameterToDiv(type, parameterEditor) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <DateParameterEditor
              previewed={parameterEditor.props.previewed}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
            />
          </div>
        );
      }
    }
  },
  {
    id: "dateTime",
    parameterTypeToDiv: function DateTimeParameterToDiv(type, parameterEditor) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <DateTimeParameterEditor
              previewed={parameterEditor.props.previewed}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
              terria={parameterEditor.props.viewState.terria}
            />
          </div>
        );
      }
    }
  },
  {
    id: "region",
    parameterTypeToDiv: function RegionParameterToDiv(type, parameterEditor) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <RegionParameterEditor
              previewed={parameterEditor.props.previewed}
              viewState={parameterEditor.props.viewState}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
            />
          </div>
        );
      }
    }
  },
  {
    id: "regionType",
    parameterTypeToDiv: function RegionTypeParameterToDiv(
      type,
      parameterEditor
    ) {
      if (type === this.id) {
        const regionParam = parameterEditor.props.previewed.parameters.filter(
          function (param) {
            return (
              defined(param.regionTypeParameter) &&
              param.regionTypeParameter === parameterEditor.props.parameter
            );
          }
        )[0];
        return (
          <div>
            {regionParam === undefined && (
              <>
                {parameterEditor.renderLabel()}
                <RegionTypeParameterEditor
                  previewed={parameterEditor.props.previewed}
                  parameter={parameterEditor.props.parameter}
                  parameterViewModel={parameterEditor.props.parameterViewModel}
                />
              </>
            )}

            {!parameterEditor.props.parameter.showInUi && (
              <div className="Placeholder for regionType" />
            )}
          </div>
        );
      }
    }
  },
  {
    id: "boolean",
    parameterTypeToDiv: function BooleanParameterToDiv(type, parameterEditor) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.props.parameter.hasNamedStates &&
              parameterEditor.renderLabel()}
            <BooleanParameterEditor
              previewed={parameterEditor.props.previewed}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
            />
          </div>
        );
      }
    }
  },
  {
    id: "boolean-group",
    parameterTypeToDiv: function BooleanParameterGroupToDiv(
      type,
      parameterEditor
    ) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <BooleanParameterGroupEditor
              previewed={parameterEditor.props.previewed}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
            />
          </div>
        );
      }
    }
  },
  {
    id: "geojson",
    parameterTypeToDiv: function GeoJsonParameterToDiv(type, parameterEditor) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <GeoJsonParameterEditor
              previewed={parameterEditor.props.previewed}
              viewState={parameterEditor.props.viewState}
              parameter={parameterEditor.props.parameter}
            />
          </div>
        );
      }
    }
  },
  {
    id: "info",
    parameterTypeToDiv: function GenericParameterToDiv(type, parameterEditor) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <InfoParameterEditor
              previewed={parameterEditor.props.previewed}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
            />
          </div>
        );
      }
    }
  },
  {
    id: "generic",
    parameterTypeToDiv: function GenericParameterToDiv(type, parameterEditor) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <GenericParameterEditor
              previewed={parameterEditor.props.previewed}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
            />
          </div>
        );
      }
    }
  },
  {
    id: "number",
    parameterTypeToDiv: function NumberParameterToDiv(type, parameterEditor) {
      if (type === this.id) {
        return (
          <div>
            {parameterEditor.renderLabel()}
            <NumberParameterEditor
              previewed={parameterEditor.props.previewed}
              parameter={parameterEditor.props.parameter}
              parameterViewModel={parameterEditor.props.parameterViewModel}
            />
          </div>
        );
      }
    }
  }
];

export default ParameterEditor;
