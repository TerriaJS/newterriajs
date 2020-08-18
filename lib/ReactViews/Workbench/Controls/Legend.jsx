"use strict";

import classNames from "classnames";
import createReactClass from "create-react-class";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import Resource from "terriajs-cesium/Source/Core/Resource";
import knockout from "terriajs-cesium/Source/ThirdParty/knockout";
import isDefined from "../../../Core/isDefined";
import URI from "urijs";
import proxyCatalogItemUrl from "../../../Models/proxyCatalogItemUrl";
import Loader from "../../Loader";
import Styles from "./legend.scss";

/* A lookup map for displayable mime types */
const DISPLAYABLE_MIME_TYPES = [
  "image/jpeg",
  "image/gif",
  "image/png",
  "image/svg+xml",
  "image/bmp",
  "image/x-bmp"
].reduce(function(acc, mimeType) {
  acc[mimeType] = true;
  return acc;
}, {});
const IMAGE_URL_REGEX = /[.\/](png|jpg|jpeg|gif|svg)/i;

function checkMimeType(legendUrl) {
  if (legendUrl.urlMimeType) {
    return !!DISPLAYABLE_MIME_TYPES[legendUrl.urlMimeType];
  }

  return !!legendUrl.url.match(IMAGE_URL_REGEX);
}

const Legend = createReactClass({
  displayName: "Legend",

  propTypes: {
    item: PropTypes.object,
    forPrint: PropTypes.bool
  },

  getDefaultProps() {
    return {
      forPrint: false
    };
  },

  /* eslint-disable-next-line camelcase */
  UNSAFE_componentWillMount() {
    this.legendsWithError = {};
  },

  onImageError(legend) {
    this.legendsWithError[legend.url] = true;
  },

  doesLegendHaveError(legend) {
    const hasError = this.legendsWithError[legend.url];
    if (!defined(hasError)) {
      this.legendsWithError[legend.url] = false;
      knockout.track(this.legendsWithError, [legend.url]);
    }
    return this.legendsWithError[legend.url];
  },

  renderLegend(legend, i) {
    if (defined(legend.url)) {
      return this.renderImageLegend(legend, i);
    } else if (defined(legend.items)) {
      return this.renderGeneratedLegend(legend, i);
    } else {
      return null;
    }
  },

  renderImageLegend(legend, i) {
    const isImage = checkMimeType(legend);
    const insertDirectly = !!legend.safeSvgContent; // we only insert content we generated ourselves, not arbitrary SVG from init files.

    const svg = legend.safeSvgContent;
    // Safari xlink NS issue fix
    const processedSvg = svg ? svg.replace(/NS\d+:href/gi, "xlink:href") : null;
    const safeSvgContent = { __html: processedSvg };

    // We proxy the legend so it's cached, and so that the Print/Export feature works with non-CORS servers.
    // We make it absolute because the print view is opened on a different domain (about:blank) so relative
    // URLs will not work.
    const proxiedUrl = makeAbsolute(
      proxyCatalogItemUrl(this.props.item, legend.url)
    );

    return (
      <Choose>
        <When condition={isImage && insertDirectly}>
          <li
            key={i}
            onError={this.onImageError.bind(this, legend)}
            className={classNames(Styles.legendSvg, {
              [Styles.legendImagehasError]: this.doesLegendHaveError(legend)
            })}
            dangerouslySetInnerHTML={safeSvgContent}
          />
        </When>
        <When condition={isImage}>
          <li
            key={proxiedUrl}
            className={classNames({
              [Styles.legendImagehasError]: this.doesLegendHaveError(legend)
            })}
          >
            <a
              onError={this.onImageError.bind(this, legend)}
              href={proxiedUrl}
              className={Styles.imageAnchor}
              target="_blank"
              rel="noreferrer noopener"
            >
              <img src={proxiedUrl} />
            </a>
          </li>
        </When>
        <Otherwise>
          <li key={proxiedUrl}>
            <a
              href={proxiedUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={Styles.legendOpenExternally}
            >
              Open legend in a separate tab
            </a>
          </li>
        </Otherwise>
      </Choose>
    );
  },

  renderGeneratedLegend(legend, i) {
    return (
      <li key={i} className={Styles.generatedLegend}>
        <table>
          <tbody>{legend.items.map(this.renderLegendItem)}</tbody>
        </table>
      </li>
    );
  },

  renderLegendItem(legendItem, i) {
    let boxStyle = {
      border: legendItem.addSpacingAbove ? "1px solid black" : undefined
    };
    if (legendItem.outlineColor) {
      boxStyle.border = `1px solid ${legendItem.outlineColor}`;
    }

    let boxContents = <></>;

    // Browsers don't print background colors by default, so we render things a little differently.
    // Chrome and Firefox let you override this, but not IE and Edge. So...
    if (this.props.forPrint) {
      if (legendItem.imageUrl) {
        boxContents = (
          <img width="20px" height="16px" src={legendItem.imageUrl} />
        );
      } else {
        boxContents = <>&#9632;</>;
        boxStyle = {
          color: legendItem.color,
          fontSize: "48px",
          lineHeight: "16px",
          ...boxStyle
        };
      }
    } else {
      if (legendItem.imageUrl) {
        boxStyle = {
          backgroundImage: `url(${legendItem.imageUrl})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          width: `${legendItem.imageWidth}px`,
          ...boxStyle
        };
      } else {
        boxStyle = {
          border: `1px solid ${legendItem.outlineColor}`,
          backgroundColor: legendItem.color,
          minWidth: "20px"
        };
      }
    }
    const rowStyle = {
      height: `${legendItem.imageHeight + 2}px`
    };
    return (
      <React.Fragment key={i}>
        {legendItem.addSpacingAbove && (
          <tr className={Styles.legendSpacer}>
            <td />
          </tr>
        )}
        <tr style={rowStyle}>
          <td style={boxStyle}>{boxContents}</td>
          <td className={Styles.legendTitles}>
            {legendItem.titleAbove && (
              <div className={Styles.legendTitleAbove}>
                {legendItem.titleAbove}
              </div>
            )}
            <div
              title={
                isDefined(legendItem.multipleTitles)
                  ? legendItem.multipleTitles.join(", ")
                  : legendItem.title
              }
            >
              {isDefined(legendItem.multipleTitles)
                ? `${legendItem.multipleTitles
                    .slice(0, legendItem.maxMultipleTitlesShowed)
                    .join(", ")}${
                    legendItem.multipleTitles.length >
                    legendItem.maxMultipleTitlesShowed
                      ? "..."
                      : ""
                  }`
                : legendItem.title}
            </div>
            {legendItem.titleBelow && (
              <div className={Styles.legendTitleBelow}>
                {legendItem.titleBelow}
              </div>
            )}
          </td>
        </tr>
      </React.Fragment>
    );
  },

  render() {
    if (this.props.item.hideLegendInWorkbench) return null;

    return (
      <ul className={Styles.legend}>
        <div className={Styles.legendInner}>
          <Choose>
            <When condition={this.props.item.isLoadingMapItems}>
              <li className={Styles.loader}>
                <Loader message={this.props.item.loadingMessage} />
              </li>
            </When>
            <Otherwise>
              <For each="legend" index="i" of={this.props.item.legends || []}>
                <If condition={isDefined(legend.title)}>
                  <h3 className={Styles.legendTitle}>{legend.title}</h3>
                </If>
                {this.renderLegend(legend, i)}
              </For>
            </Otherwise>
          </Choose>
        </div>
      </ul>
    );
  }
});

function makeAbsolute(url) {
  if (url instanceof Resource) {
    url = url.url;
  }

  const uri = new URI(url);
  if (
    uri.protocol() &&
    uri.protocol() !== "http" &&
    uri.protocol() !== "https"
  ) {
    return url;
  } else {
    return uri.absoluteTo(window.location.href).toString();
  }
}

export default observer(Legend);
