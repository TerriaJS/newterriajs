"use strict";
import classNames from "classnames";
import createReactClass from "create-react-class";
import dateFormat from "dateformat";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import Mustache from "mustache";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import formatNumberForLocale from "../../Core/formatNumberForLocale";
import propertyGetTimeValues from "../../Core/propertyGetTimeValues";
import TableMixin from "../../ModelMixins/TableMixin";
import Icon from "../../Styled/Icon";
import CustomComponent from "../Custom/CustomComponent";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import Styles from "./feature-info-section.scss";
import FeatureInfoDownload from "./FeatureInfoDownload";

// We use Mustache templates inside React views, where React does the escaping; don't escape twice, or eg. " => &quot;
Mustache.escape = function(string) {
  return string;
};

// Individual feature info section
export const FeatureInfoSection = observer(
  createReactClass({
    displayName: "FeatureInfoSection",

    propTypes: {
      viewState: PropTypes.object.isRequired,
      template: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
      feature: PropTypes.object,
      position: PropTypes.object,
      catalogItem: PropTypes.object, // Note this may not be known (eg. WFS).
      isOpen: PropTypes.bool,
      onClickHeader: PropTypes.func,
      printView: PropTypes.bool,
      t: PropTypes.func.isRequired
    },

    getInitialState() {
      return {
        removeClockSubscription: undefined,
        timeoutIds: [],
        showRawData: false
      };
    },

    /* eslint-disable-next-line camelcase */
    UNSAFE_componentWillMount() {
      setSubscriptionsAndTimeouts(this, this.props.feature);
    },

    /* eslint-disable-next-line camelcase */
    UNSAFE_componentWillReceiveProps(nextProps) {
      // If the feature changed (without an unmount/mount),
      // change the subscriptions that handle time-varying data.
      if (nextProps.feature !== this.props.feature) {
        removeSubscriptionsAndTimeouts(this);
        setSubscriptionsAndTimeouts(this, nextProps.feature);
      }
    },

    componentWillUnmount() {
      removeSubscriptionsAndTimeouts(this);
    },

    getPropertyValues() {
      return getPropertyValuesForFeature(
        this.props.feature,
        currentTimeIfAvailable(this),
        this.props.template && this.props.template.formats
      );
    },

    getTemplateData() {
      const propertyData = Object.assign({}, this.getPropertyValues());

      // Alises is a map from `key` (which exists in propertyData.properties) to some `aliasKey` which needs to resolve to `key`
      // and Yes, this is awful, but not that much worse than what was done in V7
      let aliases = [];
      if (TableMixin.isMixedInto(this.props.catalogItem)) {
        aliases = this.props.catalogItem.columns
          .filter(col => col.name && col.title && col.name !== col.title)
          .map(col => [col.name, col.title]);
      }

      // Always overwrite using aliases so that applying titles to columns doesn't break feature info templates
      aliases.forEach(([name, title]) => {
        propertyData[name] = propertyData[title];
      });

      // Properties accessible as {name, value} array; useful when you want
      // to iterate anonymous property values in the mustache template.
      propertyData.properties = Object.entries(propertyData).map(
        ([name, value]) => ({
          name,
          value
        })
      );

      // Add entire feature object
      propertyData.feature = this.props.feature;

      const partials = this.props.template?.partials ?? {};
      propertyData.terria = {
        partialByName: mustacheRenderPartialByName(partials, propertyData),
        formatNumber: mustacheFormatNumberFunction,
        formatDateTime: mustacheFormatDateTime,
        urlEncodeComponent: mustacheURLEncodeTextComponent,
        urlEncode: mustacheURLEncodeText
      };
      if (this.props.position) {
        const latLngInRadians = Ellipsoid.WGS84.cartesianToCartographic(
          this.props.position
        );
        propertyData.terria.coords = {
          latitude: CesiumMath.toDegrees(latLngInRadians.latitude),
          longitude: CesiumMath.toDegrees(latLngInRadians.longitude)
        };
      }
      if (this.props.catalogItem) {
        propertyData.terria.currentTime = this.props.catalogItem.discreteTime;
      }
      propertyData.terria.timeSeries = getTimeSeriesChartContext(
        this.props.catalogItem,
        this.props.feature,
        propertyData._terria_getChartDetails
      );

      return propertyData;
    },

    clickHeader() {
      if (defined(this.props.onClickHeader)) {
        this.props.onClickHeader(this.props.feature);
      }
    },

    hasTemplate() {
      return (
        this.props.template &&
        (typeof this.props.template === "string" ||
          this.props.template.template)
      );
    },

    descriptionFromTemplate() {
      const { t } = this.props;
      const template = this.props.template;
      const templateData = this.getTemplateData();

      // templateData may not be defined if a re-render gets triggered in the middle of a feature updating.
      // (Recall we re-render whenever feature.definitionChanged triggers.)
      if (defined(templateData)) {
        return typeof template === "string"
          ? Mustache.render(template, templateData)
          : Mustache.render(template.template, templateData, template.partials);
      } else {
        return t("featureInfo.noInfoAvailable");
      }
    },

    descriptionFromFeature() {
      const feature = this.props.feature;
      const showStringIfPropertyValueIsNull =
        this.props.catalogItem === undefined
          ? false
          : this.props.catalogItem.showStringIfPropertyValueIsNull;

      // This description could contain injected <script> tags etc.
      // Before rendering, we will pass it through parseCustomMarkdownToReact, which applies
      //     markdownToHtml (which applies MarkdownIt.render and DOMPurify.sanitize), and then
      //     parseCustomHtmlToReact (which calls htmlToReactParser).
      // Note that there is an unnecessary HTML encoding and decoding in this combination which would be good to remove.
      const currentTime = currentTimeIfAvailable(this)
        ? currentTimeIfAvailable(this)
        : JulianDate.now();
      let description =
        feature.currentDescription ||
        getCurrentDescription(feature, currentTime);
      if (!defined(description) && defined(feature.properties)) {
        description = describeFromProperties(
          feature.properties,
          currentTime,
          showStringIfPropertyValueIsNull
        );
      }
      return description;
    },

    renderDataTitle() {
      const { t } = this.props;
      const template = this.props.template;
      if (typeof template === "object" && defined(template.name)) {
        return Mustache.render(template.name, this.getPropertyValues());
      }
      const feature = this.props.feature;
      return (feature && feature.name) || t("featureInfo.siteData");
    },

    isFeatureTimeVarying(feature) {
      // The feature is NOT time-varying if:
      // 1. There is no info (ie. no description and no properties).
      // 2. A template is provided and all feature.properties are constant.
      // OR
      // 3. No template is provided, and feature.description is either not defined, or defined and constant.
      // If info is time-varying, we need to keep updating the description.
      if (!defined(feature.description) && !defined(feature.properties)) {
        return false;
      }
      if (defined(this.props.template)) {
        return !areAllPropertiesConstant(feature.properties);
      }
      if (defined(feature.description)) {
        return !feature.description.isConstant; // This should always be a "Property" eg. a ConstantProperty.
      }
      return false;
    },

    toggleRawData() {
      this.setState({
        showRawData: !this.state.showRawData
      });
    },

    render() {
      const { t } = this.props;
      const catalogItemName =
        (this.props.catalogItem && this.props.catalogItem.name) || "";
      let baseFilename = catalogItemName;
      // Add the Lat, Lon to the baseFilename if it is possible and not already present.
      if (this.props.position) {
        const position = Ellipsoid.WGS84.cartesianToCartographic(
          this.props.position
        );
        const latitude = CesiumMath.toDegrees(position.latitude);
        const longitude = CesiumMath.toDegrees(position.longitude);
        const precision = 5;
        // Check that baseFilename doesn't already contain the lat, lon with the similar or better precision.
        if (
          typeof baseFilename !== "string" ||
          !contains(baseFilename, latitude, precision) ||
          !contains(baseFilename, longitude, precision)
        ) {
          baseFilename +=
            " - Lat " +
            latitude.toFixed(precision) +
            " Lon " +
            longitude.toFixed(precision);
        }
      }
      const fullName =
        (catalogItemName ? catalogItemName + " - " : "") +
        this.renderDataTitle();
      const reactInfo = getInfoAsReactComponent(this);

      return (
        <li className={classNames(Styles.section)}>
          <If condition={this.props.printView}>
            <h2>{fullName}</h2>
          </If>
          <If condition={!this.props.printView}>
            <button
              type="button"
              onClick={this.clickHeader}
              className={Styles.title}
            >
              <span>{fullName}</span>
              {this.props.isOpen ? (
                <Icon glyph={Icon.GLYPHS.opened} />
              ) : (
                <Icon glyph={Icon.GLYPHS.closed} />
              )}
            </button>
          </If>
          <If condition={this.props.isOpen}>
            <section className={Styles.content}>
              <If condition={!this.props.printView && this.hasTemplate()}>
                <button
                  type="button"
                  className={Styles.rawDataButton}
                  onClick={this.toggleRawData}
                >
                  {this.state.showRawData
                    ? t("featureInfo.showCuratedData")
                    : t("featureInfo.showRawData")}
                </button>
              </If>
              <div>
                <Choose>
                  <When
                    condition={reactInfo.showRawData || !this.hasTemplate()}
                  >
                    <If condition={reactInfo.hasRawData}>
                      {reactInfo.rawData}
                    </If>
                    <If condition={!reactInfo.hasRawData}>
                      <div ref="no-info" key="no-info">
                        {t("featureInfo.noInfoAvailable")}
                      </div>
                    </If>
                    <If
                      condition={
                        !this.props.printView && reactInfo.timeSeriesChart
                      }
                    >
                      <div className={Styles.timeSeriesChart}>
                        <h4>{reactInfo.timeSeriesChartTitle}</h4>
                        {reactInfo.timeSeriesChart}
                      </div>
                    </If>
                    <If
                      condition={
                        !this.props.printView &&
                        defined(reactInfo.downloadableData)
                      }
                    >
                      <FeatureInfoDownload
                        key="download"
                        viewState={this.props.viewState}
                        data={reactInfo.downloadableData}
                        name={baseFilename}
                      />
                    </If>
                  </When>
                  <Otherwise>{reactInfo.info}</Otherwise>
                </Choose>
                <For
                  each="ExtraComponent"
                  index="i"
                  of={FeatureInfoSection.extraComponents}
                >
                  <ExtraComponent
                    key={i}
                    viewState={this.props.viewState} // eslint-disable-line react/jsx-no-undef
                    template={this.props.template}
                    feature={this.props.feature}
                    position={this.props.position}
                    // We should deprecate clock here and remove it alltogether, but currently leaving so don't break API.
                    // Clients can and should use catalogItem.clock and catalogItem.currentTime.
                    clock={clockIfAvailable(this)}
                    catalogItem={this.props.catalogItem}
                    isOpen={this.props.isOpen}
                    onClickHeader={this.props.onClickHeader}
                  />
                </For>
              </div>
            </section>
          </If>
        </li>
      );
    }
  })
);

/**
 * Returns the clockForDisplay for the catalogItem if it is avaliable, otherwise returns undefined.
 * @private
 */
function clockIfAvailable(featureInfoSection) {
  if (defined(featureInfoSection.props.catalogItem)) {
    return featureInfoSection.props.catalogItem.clock;
  }

  return undefined;
}

/**
 * Returns the currentTime for the catalogItem if it is avaliable, otherwise returns undefined.
 * @private
 */
function currentTimeIfAvailable(featureInfoSection) {
  if (defined(featureInfoSection.props.catalogItem)) {
    return featureInfoSection.props.catalogItem.currentTimeAsJulianDate;
  }

  return undefined;
}

/**
 * Do we need to dynamically update this feature info over time?
 * There are three situations in which we would:
 * 1. When the feature description or properties are time-varying.
 * 2. When a custom component self-updates.
 *    Eg. <chart poll-seconds="60" src="xyz.csv"> must reload data from xyz.csv every 60 seconds.
 * 3. When a catalog item changes a feature's properties, eg. changing from a daily view to a monthly view.
 *
 * For (1), use catalogItem.clock.currentTime knockout observable so don't need to do anything specific here.
 * For (2), use a regular javascript setTimeout to update a counter in feature's currentProperties.
 * For (3), use an event listener on the Feature's underlying Entity's "definitionChanged" event.
 *   Conceivably it could also be handled by the catalog item itself changing, if its change is knockout tracked, and the
 *   change leads to a change in what is rendered (unlikely).
 * Since the catalogItem is also a prop, this will trigger a rerender.
 * @private
 */
function setSubscriptionsAndTimeouts(featureInfoSection, feature) {
  featureInfoSection.setState({
    removeFeatureChangedSubscription: feature.definitionChanged.addEventListener(
      function(changedFeature) {
        runInAction(() => {
          setCurrentFeatureValues(
            changedFeature,
            currentTimeIfAvailable(featureInfoSection)
          );
        });
      }
    )
  });

  // setTimeoutsForUpdatingCustomComponents(featureInfoSection);
}

/**
 * Remove the clock subscription (event listener) and timeouts.
 * @private
 */
function removeSubscriptionsAndTimeouts(featureInfoSection) {
  if (defined(featureInfoSection.state.removeFeatureChangedSubscription)) {
    featureInfoSection.state.removeFeatureChangedSubscription();
    featureInfoSection.setState({
      removeFeatureChangedSubscription: undefined
    });
  }
  featureInfoSection.state.timeoutIds.forEach(id => {
    clearTimeout(id);
  });
}

/**
 * Gets a map of property labels to property values for a feature at the provided current time.
 * @private
 * @param {Entity} feature A feature to get values for.
 * @param {JulianDate} currentTime A knockout observable containing the currentTime.
 * @param {Object} [formats] A map of property labels to the number formats that should be applied for them.
 */
function getPropertyValuesForFeature(feature, currentTime, formats) {
  // Manipulate the properties before templating them.
  // If they require .getValue, apply that.
  // If they have bad keys, fix them.
  // If they have formatting, apply it.
  const properties =
    feature.currentProperties ||
    propertyGetTimeValues(feature.properties, currentTime);
  // Try JSON.parse on values that look like JSON arrays or objects
  let result = parseValues(properties);
  result = replaceBadKeyCharacters(result);
  if (defined(formats)) {
    applyFormatsInPlace(result, formats);
  }
  return result;
}

function parseValues(properties) {
  // JSON.parse property values that look like arrays or objects
  const result = {};
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      let val = properties[key];
      if (
        val &&
        (typeof val === "string" || val instanceof String) &&
        /^\s*[[{]/.test(val)
      ) {
        try {
          val = JSON.parse(val);
        } catch (e) {}
      }
      result[key] = val;
    }
  }
  return result;
}

/**
 * Formats values in an object if their keys match the provided formats object.
 * @private
 * @param {Object} properties a map of property labels to property values.
 * @param {Object} formats A map of property labels to the number formats that should be applied for them.
 */
function applyFormatsInPlace(properties, formats) {
  // Optionally format each property. Updates properties in place, returning nothing.
  for (const key in formats) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      // Default type if not provided is number.
      if (
        !defined(formats[key].type) ||
        (defined(formats[key].type) && formats[key].type === "number")
      ) {
        runInAction(() => {
          properties[key] = formatNumberForLocale(
            properties[key],
            formats[key]
          );
        });
      }
      if (defined(formats[key].type)) {
        if (formats[key].type === "dateTime") {
          runInAction(() => {
            properties[key] = formatDateTime(properties[key], formats[key]);
          });
        }
      }
    }
  }
}

/**
 * Recursively replace '.' and '#' in property keys with _, since Mustache cannot reference keys with these characters.
 * @private
 */
function replaceBadKeyCharacters(properties) {
  // if properties is anything other than an Object type, return it. Otherwise recurse through its properties.
  if (
    !properties ||
    typeof properties !== "object" ||
    Array.isArray(properties)
  ) {
    return properties;
  }
  const result = {};
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const cleanKey = key.replace(/[.#]/g, "_");
      result[cleanKey] = replaceBadKeyCharacters(properties[key]);
    }
  }
  return result;
}

/**
 * Determines whether all properties in the provided properties object have an isConstant flag set - otherwise they're
 * assumed to be time-varying.
 * @private
 * @returns {boolean}
 */
function areAllPropertiesConstant(properties) {
  // test this by assuming property is time-varying only if property.isConstant === false.
  // (so if it is undefined or true, it is constant.)
  let result = true;
  if (defined(properties.isConstant)) {
    return properties.isConstant;
  }
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      result =
        result &&
        defined(properties[key]) &&
        properties[key].isConstant !== false;
    }
  }
  return result;
}

/**
 * Gets a text description for the provided feature at a certain time.
 * @private
 * @param {Entity} feature
 * @param {JulianDate} currentTime
 * @returns {String}
 */
function getCurrentDescription(feature, currentTime) {
  if (
    feature.description &&
    typeof feature.description.getValue === "function"
  ) {
    return feature.description.getValue(currentTime);
  }
  return feature.description;
}

/**
 * Updates {@link Entity#currentProperties} and {@link Entity#currentDescription} with the values at the provided time.
 * @private
 * @param {Entity} feature
 * @param {JulianDate} currentTime
 */
function setCurrentFeatureValues(feature, currentTime) {
  const newProperties = propertyGetTimeValues(feature.properties, currentTime);
  if (newProperties !== feature.currentProperties) {
    feature.currentProperties = newProperties;
  }
  const newDescription = getCurrentDescription(feature, currentTime);
  if (newDescription !== feature.currentDescription) {
    feature.currentDescription = newDescription;
  }
}

/**
 * Returns a function which extracts JSON elements from the content of a Mustache section template and calls the
 * supplied customProcessing function with the extracted JSON options, example syntax processed:
 * {optionKey: optionValue}{{value}}
 * @private
 */
function mustacheJsonSubOptions(customProcessing) {
  return function(text, render) {
    // Eg. "{foo:1}hi there".match(optionReg) = ["{foo:1}hi there", "{foo:1}", "hi there"].
    // Note this won't work with nested objects in the options (but these aren't used yet).
    // Note I use [\s\S]* instead of .* at the end - .* does not match newlines, [\s\S]* does.
    const optionReg = /^(\{[^}]+\})([\s\S]*)/;
    const components = text.match(optionReg);
    // This regex unfortunately matches double-braced text like {{number}}, so detect that separately and do not treat it as option json.
    const startsWithdoubleBraces =
      text.length > 4 && text[0] === "{" && text[1] === "{";
    if (!components || startsWithdoubleBraces) {
      // If no options were provided, just use the defaults.
      return customProcessing(render(text));
    }
    // Allow {foo: 1} by converting it to {"foo": 1} for JSON.parse.
    const quoteReg = /([{,])(\s*)([A-Za-z0-9_\-]+?)\s*:/g;
    const jsonOptions = components[1].replace(quoteReg, '$1"$3":');
    const options = JSON.parse(jsonOptions);
    return customProcessing(render(components[2]), options);
  };
}

/**
 * Returns a function which implements number formatting in Mustache templates, using this syntax:
 * {{#terria.formatNumber}}{useGrouping: true}{{value}}{{/terria.formatNumber}}
 * @private
 */
function mustacheFormatNumberFunction() {
  return mustacheJsonSubOptions(formatNumberForLocale);
}

/**
 * Returns a function that replaces value in Mustache templates, using this syntax:
 * {
 *   "template": {{#terria.partialByName}}{{value}}{{/terria.partialByName}}.
 *   "partials": {
 *     "value1": "replacement1",
 *     ...
 *   }
 * }
 * 
 * E.g. {{#terria.partialByName}}{{value}}{{/terria.partialByName}}
     "featureInfoTemplate": {
        "template": "{{Pixel Value}} dwellings in {{#terria.partialByName}}{{feature.data.layerId}}{{/terria.partialByName}} radius.",
        "partials": {
          "0": "100m",
          "1": "500m",
          "2": "1km",
          "3": "2km"
        }
      }
 * @private
 */
function mustacheRenderPartialByName(partials, templateData) {
  return () => {
    return mustacheJsonSubOptions((value, options) => {
      if (partials && typeof partials[value] === "string") {
        return Mustache.render(partials[value], templateData);
      } else {
        return Mustache.render(value, templateData);
      }
    });
  };
}

/**
 * Formats the date according to the date format string.
 * If the date expression can't be parsed using Date.parse() it will be returned unmodified.
 *
 * @param {String} text The date to format.
 * @param {Object} options Object with the following properties:
 * @param {String} options.format If present, will override the default date format using the npm datefromat package
 *                                format (see https://www.npmjs.com/package/dateformat). E.g. "isoDateTime"
 *                                or "dd-mm-yyyy HH:MM:ss". If not supplied isoDateTime will be used.
 * @private
 */
function formatDateTime(text, options) {
  const date = Date.parse(text);

  if (!defined(date) || isNaN(date)) {
    return text;
  }

  if (defined(options) && defined(options.format)) {
    return dateFormat(date, options.format);
  }

  return dateFormat(date, "isoDateTime");
}

/**
 * Returns a function which implements date/time formatting in Mustache templates, using this syntax:
 * {{#terria.formatDateTime}}{format: "npm dateFormat string"}DateExpression{{/terria.formatDateTime}}
 * format If present, will override the default date format (see https://www.npmjs.com/package/dateformat)
 * Eg. "isoDateTime" or "dd-mm-yyyy HH:MM:ss".
 * If the Date_Expression can't be parsed using Date.parse() it will be used(returned) unmodified by the terria.formatDateTime section expression.
 * If no valid date formatting options are present in the terria.formatDateTime section isoDateTime will be used.
 * @private
 */
function mustacheFormatDateTime() {
  return mustacheJsonSubOptions(formatDateTime);
}

/**
 * URL Encodes provided text: {{#terria.urlEncodeComponent}}{{value}}{{/terria.urlEncodeComponent}}.
 * See encodeURIComponent for details.
 *
 * {{#terria.urlEncodeComponent}}W/HO:E#1{{/terria.urlEncodeComponent}} -> W%2FHO%3AE%231
 * @private
 */
function mustacheURLEncodeTextComponent() {
  return function(text, render) {
    return encodeURIComponent(render(text));
  };
}

/**
 * URL Encodes provided text: {{#terria.urlEncode}}{{value}}{{/terria.urlEncode}}.
 * See encodeURI for details.
 *
 * {{#terria.urlEncode}}http://example.com/a b{{/terria.urlEncode}} -> http://example.com/a%20b
 * @private
 */
function mustacheURLEncodeText() {
  return function(text, render) {
    return encodeURI(render(text));
  };
}

const simpleStyleIdentifiers = [
  "title",
  "description",
  "marker-size",
  "marker-symbol",
  "marker-color",
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "fill",
  "fill-opacity"
];

/**
 * A way to produce a description if properties are available but no template is given.
 * Derived from Cesium's geoJsonDataSource, but made to work with possibly time-varying properties.
 * @private
 */
function describeFromProperties(
  properties,
  time,
  showStringIfPropertyValueIsNull
) {
  let html = "";
  if (typeof properties.getValue === "function") {
    properties = properties.getValue(time);
  }
  if (typeof properties === "object") {
    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        if (simpleStyleIdentifiers.indexOf(key) !== -1) {
          continue;
        }
        let value = properties[key];
        if (defined(showStringIfPropertyValueIsNull) && !defined(value)) {
          value = showStringIfPropertyValueIsNull;
        }
        if (defined(value)) {
          if (typeof value.getValue === "function") {
            value = value.getValue(time);
          }
          if (Array.isArray(properties)) {
            html +=
              "<tr><td>" +
              describeFromProperties(
                value,
                time,
                showStringIfPropertyValueIsNull
              ) +
              "</td></tr>";
          } else if (typeof value === "object") {
            html +=
              "<tr><th>" +
              key +
              "</th><td>" +
              describeFromProperties(
                value,
                time,
                showStringIfPropertyValueIsNull
              ) +
              "</td></tr>";
          } else {
            html += "<tr><th>" + key + "</th><td>" + value + "</td></tr>";
          }
        }
      }
    }
  } else {
    // properties is only a single value.
    html += "<tr><th>" + "</th><td>" + properties + "</td></tr>";
  }
  if (html.length > 0) {
    html =
      '<table class="cesium-infoBox-defaultTable"><tbody>' +
      html +
      "</tbody></table>";
  }
  return html;
}

/**
 * Get parameters that should be exposed to the template, to help show a timeseries chart of the feature data.
 * @private
 */
function getTimeSeriesChartContext(catalogItem, feature, getChartDetails) {
  // Only show it as a line chart if the details are available, the data is sampled (so a line chart makes sense), and charts are available.
  if (
    defined(getChartDetails) &&
    defined(catalogItem) &&
    catalogItem.isSampled &&
    CustomComponent.isRegistered("chart")
  ) {
    const chartDetails = getChartDetails();
    const { title, csvData } = chartDetails;
    const distinguishingId = catalogItem.dataViewId;
    const featureId = defined(distinguishingId)
      ? distinguishingId + "--" + feature.id
      : feature.id;
    if (chartDetails) {
      const result = {
        ...chartDetails,
        id: featureId?.replace(/\"/g, ""),
        data: csvData?.replace(/\\n/g, "\\n")
      };
      const idAttr = 'id="' + result.id + '" ';
      const sourceAttr = 'sources="1"';
      const titleAttr = title ? `title="${title}"` : "";
      result.chart = `<chart ${idAttr} ${sourceAttr} ${titleAttr}>${result.data}</chart>`;
      return result;
    }
  }
}

/**
 * Wrangle the provided feature data into more convenient forms.
 * @private
 * @param  {ReactClass} that The FeatureInfoSection.
 * @return {Object} Returns {info, rawData, showRawData, hasRawData, ...}.
 *                  info is the main body of the info section, as a react component.
 *                  rawData is the same for the raw data, if it needs to be shown.
 *                  showRawData is whether to show the rawData.
 *                  hasRawData is whether there is any rawData to show.
 *                  timeSeriesChart - if the feature has timeseries data that could be shown in chart, this is the chart.
 *                  downloadableData is the same as template data, but numerical.
 */
function getInfoAsReactComponent(that) {
  const templateData = that.getPropertyValues();
  const downloadableData = defined(templateData)
    ? templateData._terria_numericalProperties || templateData
    : undefined;
  const updateCounters = that.props.feature.updateCounters;
  const context = {
    terria: that.props.viewState.terria,
    catalogItem: that.props.catalogItem,
    feature: that.props.feature,
    updateCounters: updateCounters
  };
  let timeSeriesChart;
  let timeSeriesChartTitle;

  if (defined(templateData)) {
    const timeSeriesChartContext = getTimeSeriesChartContext(
      that.props.catalogItem,
      that.props.feature,
      templateData._terria_getChartDetails
    );
    if (defined(timeSeriesChartContext)) {
      timeSeriesChart = parseCustomMarkdownToReact(
        timeSeriesChartContext.chart,
        context
      );
      timeSeriesChartTitle = timeSeriesChartContext.title;
    }
  }
  const showRawData = !that.hasTemplate() || that.state.showRawData;
  let rawDataHtml;
  let rawData;
  if (showRawData) {
    rawDataHtml = that.descriptionFromFeature();
    if (defined(rawDataHtml)) {
      rawData = parseCustomMarkdownToReact(rawDataHtml, context);
    }
  }
  return {
    info: that.hasTemplate()
      ? parseCustomMarkdownToReact(that.descriptionFromTemplate(), context)
      : rawData,
    rawData: rawData,
    showRawData: showRawData,
    hasRawData: !!rawDataHtml,
    timeSeriesChartTitle: timeSeriesChartTitle,
    timeSeriesChart: timeSeriesChart,
    downloadableData: downloadableData
  };
}

// function setTimeoutsForUpdatingCustomComponents(that) {
//   // eslint-disable-line require-jsdoc
//   const { info } = getInfoAsReactComponent(that);
//   const foundCustomComponents = CustomComponent.find(info);
//   foundCustomComponents.forEach((match, componentNumber) => {
//     const updateSeconds = match.type.selfUpdateSeconds(match.reactComponent);
//     if (updateSeconds > 0) {
//       setTimeoutForUpdatingCustomComponent(
//         that,
//         match.reactComponent,
//         updateSeconds,
//         componentNumber
//       );
//     }
//   });
// }

// function setTimeoutForUpdatingCustomComponent(
//   that,
//   reactComponent,
//   updateSeconds,
//   componentNumber
// ) {
//   // eslint-disable-line require-jsdoc
//   const timeoutId = setTimeout(() => {
//     // Update the counter for this component. Handle various undefined cases.
//     const updateCounters = that.props.feature.updateCounters;
//     const counterObject = {
//       reactComponent: reactComponent,
//       counter:
//         defined(updateCounters) && defined(updateCounters[componentNumber])
//           ? updateCounters[componentNumber].counter + 1
//           : 1
//     };
//     if (!defined(that.props.feature.updateCounters)) {
//       const counters = {};
//       counters[componentNumber] = counterObject;
//       that.props.feature.updateCounters = counters;
//     } else {
//       that.props.feature.updateCounters[componentNumber] = counterObject;
//     }
//     // And finish by triggering the next timeout, but do this in another timeout so we aren't nesting setStates.
//     setTimeout(() => {
//       setTimeoutForUpdatingCustomComponent(
//         that,
//         reactComponent,
//         updateSeconds,
//         componentNumber
//       );
//       // console.log('Removing ' + timeoutId + ' from', that.state.timeoutIds);
//       that.setState({
//         timeoutIds: that.state.timeoutIds.filter(id => timeoutId !== id)
//       });
//     }, 5);
//   }, updateSeconds * 1000);
//   const timeoutIds = that.state.timeoutIds;
//   that.setState({ timeoutIds: timeoutIds.concat(timeoutId) });
// }

// See if text contains the number (to a precision number of digits (after the dp) either fixed up or down on the last digit).
function contains(text, number, precision) {
  // Take Math.ceil or Math.floor and use it to calculate the number with a precision number of digits (after the dp).
  function fixed(round, number) {
    const scale = Math.pow(10, precision);
    return (round(number * scale) / scale).toFixed(precision);
  }
  return (
    text.indexOf(fixed(Math.floor, number)) !== -1 ||
    text.indexOf(fixed(Math.ceil, number)) !== -1
  );
}

/**
 * Add your own react components to have them rendered in a FeatureInfoSection. ViewState will be passed as a prop.
 */
FeatureInfoSection.extraComponents = [];

export default withTranslation()(FeatureInfoSection);
