import { observer } from "mobx-react";
import React, { SyntheticEvent } from "react";
import defined from "terriajs-cesium/Source/Core/defined";
import Resource from "terriajs-cesium/Source/Core/Resource";
import URI from "urijs";
import isDefined from "../../../Core/isDefined";
import { getMakiIcon } from "../../../Map/Icons/Maki/MakiIcons";
import MinMaxLevelMixin from "../../../ModelMixins/MinMaxLevelMixin";
import TableMixin from "../../../ModelMixins/TableMixin";
import proxyCatalogItemUrl from "../../../Models/Catalog/proxyCatalogItemUrl";
import hasTraits from "../../../Models/Definition/hasTraits";
import Model, { BaseModel } from "../../../Models/Definition/Model";
import Button from "../../../Styled/Button";
import Icon, { StyledIcon } from "../../../Styled/Icon";
import LegendOwnerTraits from "../../../Traits/TraitsClasses/LegendOwnerTraits";
import LegendTraits, {
  LegendItemTraits
} from "../../../Traits/TraitsClasses/LegendTraits";
import Styles from "./legend.scss";

/* A lookup map for displayable mime types */
const DISPLAYABLE_MIME_TYPES = [
  "image/jpeg",
  "image/gif",
  "image/png",
  "image/svg+xml",
  "image/bmp",
  "image/x-bmp"
].reduce<{ [key: string]: boolean }>((acc, mimeType) => {
  acc[mimeType] = true;
  return acc;
}, {});
const IMAGE_URL_REGEX = /[./](png|jpg|jpeg|gif|svg)/i;

function checkMimeType(legend: Model<LegendTraits>) {
  return (
    (legend.urlMimeType && !!DISPLAYABLE_MIME_TYPES[legend.urlMimeType]) ||
    !!legend.url?.match(IMAGE_URL_REGEX)
  );
}

@observer
export default class Legend extends React.Component<{
  item: BaseModel;
  forPrint?: boolean;
}> {
  static defaultProps = {
    forPrint: false
  };

  onImageLoad(
    evt: SyntheticEvent<HTMLImageElement>,
    legend: Model<LegendTraits>
  ) {
    const image = evt.target as HTMLObjectElement;
    image.style.display = "none";
    image.style.maxWidth = "none";

    if (evt.type === "error") {
      return;
    }

    image.style.display = "initial";

    // If legend need scaling, this is the only way to do it :/
    // See https://stackoverflow.com/questions/7699621/display-image-at-50-of-its-native-size
    // or https://stackoverflow.com/questions/35711807/display-high-dpi-image-at-50-scaling-using-just-css

    image.style.width = `${(legend.imageScaling ?? 1) * image.offsetWidth}px`;
    // Must set maxWidth *after* setting width, as it may change offsetWidth
    image.style.maxWidth = "100%";
  }

  renderLegend(legend: Model<LegendTraits>, i: number) {
    if (defined(legend.url)) {
      return this.renderImageLegend(legend, i);
    } else if (defined(legend.items)) {
      return this.renderGeneratedLegend(legend, i);
    }
    return null;
  }

  renderImageLegend(legend: Model<LegendTraits>, _i: number) {
    const isImage = checkMimeType(legend);
    // const insertDirectly = !!legend.safeSvgContent; // we only insert content we generated ourselves, not arbitrary SVG from init files.

    // const svg = legend.safeSvgContent;
    // // Safari xlink NS issue fix
    // const processedSvg = svg ? svg.replace(/NS\d+:href/gi, "xlink:href") : null;
    // const safeSvgContent = { __html: processedSvg };

    /* We proxy the legend so it's cached, and so that the Print/Export feature works with non-CORS servers.
     * We make it absolute because the print view is opened on a different domain (about:blank) so relative
     * URLs will not work.
     */
    const proxiedUrl = isDefined(legend.url)
      ? makeAbsolute(proxyCatalogItemUrl(this.props.item, legend.url))
      : undefined;

    // padding-top: 8px;
    // padding-bottom: 8px;

    // if (isImage && insertDirectly) {
    //   return (<li
    //     key={i}
    //     className={Styles.legendSvg}
    //     dangerouslySetInnerHTML={safeSvgContent}
    //   />)
    // }

    if (!isDefined(proxiedUrl)) return null;

    if (isImage) {
      return (
        <li key={proxiedUrl}>
          <a
            href={proxiedUrl}
            className={Styles.imageAnchor}
            target="_blank"
            rel="noreferrer noopener"
            css={{ backgroundColor: legend.backgroundColor }}
          >
            <img
              src={proxiedUrl}
              // Set maxWidth to 100% if no scaling required (otherwise - see onImageLoad)
              style={{
                maxWidth:
                  !isDefined(legend.imageScaling) || legend.imageScaling === 1
                    ? "100%"
                    : undefined
              }}
              onError={(evt) => this.onImageLoad.bind(this, evt, legend)()}
              onLoad={(evt) => this.onImageLoad.bind(this, evt, legend)()}
            />
          </a>
        </li>
      );
    }

    return (
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
    );
  }

  renderGeneratedLegend(legend: Model<LegendTraits>, i: number) {
    if (isDefined(legend.items) && legend.items.length > 0) {
      return (
        <li key={i} className={Styles.generatedLegend}>
          <table css={{ backgroundColor: legend.backgroundColor }}>
            <tbody>{legend.items.map(this.renderLegendItem.bind(this))}</tbody>
          </table>
        </li>
      );
    }
    return null;
  }

  renderLegendItem(legendItem: Model<LegendItemTraits>, i: number) {
    let imageUrl = legendItem.imageUrl;

    if (legendItem.marker) {
      imageUrl =
        getMakiIcon(
          legendItem.marker,
          legendItem.color ?? "#fff", // We have to have a fallback color here for `getMakiIcon`
          legendItem.outlineWidth,
          legendItem.outlineColor,
          legendItem.imageHeight,
          legendItem.imageWidth
        ) ??
        // If getMakiIcons returns nothing, we assume legendItem.marker is a URL
        legendItem.marker;
    }

    // Set boxStyle border to solid black if we aren't showing an image AND this legend item has space above it
    let boxStyle: any = {
      border:
        !imageUrl && legendItem.addSpacingAbove ? "1px solid black" : undefined
    };

    // Override the boxStyle border if we have outlineColor and outlineWidth defined for this legend item
    if (!imageUrl && legendItem.outlineColor && legendItem.outlineWidth) {
      boxStyle.border = `${legendItem.outlineWidth}px ${
        legendItem.outlineStyle ?? "solid"
      } ${legendItem.outlineColor}`;
    }

    let boxContents;

    // Browsers don't print background colors by default, so we render things a little differently.
    // Chrome and Firefox let you override this, but not IE and Edge. So...
    if (this.props.forPrint) {
      if (imageUrl) {
        boxContents = (
          <img
            width="20px"
            height="16px"
            src={imageUrl}
            style={{ transform: `rotate(${legendItem.rotation ?? 0}deg)` }}
          />
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
      if (imageUrl || legendItem.marker) {
        boxStyle = {
          transform: `rotate(${legendItem.rotation}deg)`,
          backgroundImage: `url(${imageUrl})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "24px",
          width: `${legendItem.imageWidth}px`,
          ...boxStyle
        };
      } else {
        boxStyle = {
          backgroundColor: legendItem.color,
          minWidth: "20px",
          ...boxStyle
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
  }

  render() {
    if (
      (!hasTraits(this.props.item, LegendOwnerTraits, "legends") ||
        !hasTraits(
          this.props.item,
          LegendOwnerTraits,
          "hideLegendInWorkbench"
        )) &&
      !TableMixin.isMixedInto(this.props.item)
    ) {
      return null;
    }

    if (
      (hasTraits(this.props.item, LegendOwnerTraits, "hideLegendInWorkbench") &&
        this.props.item.hideLegendInWorkbench) ||
      (MinMaxLevelMixin.isMixedInto(this.props.item) &&
        this.props.item.scaleWorkbenchInfo)
    )
      return null;

    if (
      isDefined(this.props.item.legends) &&
      this.props.item.legends.length > 0
    ) {
      const backgroundColor = hasTraits(
        this.props.item,
        LegendOwnerTraits,
        "legendBackgroundColor"
      )
        ? this.props.item.legendBackgroundColor
        : undefined;

      return (
        <ul className={Styles.legend}>
          <div
            className={Styles.legendInner}
            css={{ position: "relative", " li": { backgroundColor } }}
          >
            {
              // Show temporary "legend button" - if custom styling has been applied
              TableMixin.isMixedInto(this.props.item) &&
              this.props.item.legendButton ? (
                <Button
                  primary
                  shortMinHeight
                  css={{ position: "absolute", top: 10, right: 0 }}
                  renderIcon={() => (
                    <StyledIcon
                      light
                      glyph={Icon.GLYPHS.menuDotted}
                      styledWidth="12px"
                    />
                  )}
                  rightIcon
                  iconProps={{ css: { marginRight: 0, marginLeft: 4 } }}
                  onClick={this.props.item.legendButton.onClick.bind(
                    this.props.item
                  )}
                >
                  {this.props.item.legendButton.title}
                </Button>
              ) : null
            }

            {(this.props.item.legends as Model<LegendTraits>[]).map(
              (legend, i: number) => (
                <React.Fragment key={i}>
                  {isDefined(legend.title) ? (
                    <h3 className={Styles.legendTitle}>{legend.title}</h3>
                  ) : null}

                  {this.renderLegend.bind(this)(legend, i)}
                </React.Fragment>
              )
            )}
          </div>
        </ul>
      );
    }

    return null;
  }
}

function makeAbsolute(url: string | Resource) {
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
