import { observer } from "mobx-react";
import React from "react";
import isDefined from "../../Core/isDefined";
import ViewState from "../../ReactViewModels/ViewState";
import parseCustomHtmlToReact from "../Custom/parseCustomHtmlToReact";
import { useViewState, withViewState } from "../Context";
import { useTheme } from "styled-components";

const DEFAULT_BRANDING =
  '<a target="_blank" href="http://terria.io"><img src="images/terria_logo.png" height="52" title="Version: {{ version }}" /></a>';

export default withViewState(
  observer((props: { viewState: ViewState; version?: string }) => {
    // Set brandingHtmlElements to brandBarElements or default Terria branding as default
    let brandingHtmlElements = props.viewState.terria.configParameters
      .brandBarElements ?? [DEFAULT_BRANDING];

    if (props.viewState.useSmallScreenInterface) {
      const brandBarSmallElements =
        props.viewState.terria.configParameters.brandBarSmallElements;
      const displayOne =
        props.viewState.terria.configParameters.displayOneBrand;

      // Use brandBarSmallElements if it exists
      if (brandBarSmallElements) brandingHtmlElements = brandBarSmallElements;
      // If no brandBarSmallElements, but displayOne parameter is selected
      // Try to find brand element based on displayOne index - OR find the first item that isn't an empty string (for backward compatability of old terriamap defaults)
      else if (isDefined(displayOne))
        brandingHtmlElements = [
          (brandingHtmlElements[displayOne] ||
            brandingHtmlElements.find((item) => item.length > 0)) ??
            DEFAULT_BRANDING
        ];
    }

    const theme = useTheme();
    const viewState = useViewState();

    const logoHeight = viewState.useSmallScreenInterface
      ? theme.logoSmallHeight
      : theme.logoHeight;

    const version = props.version ?? "Unknown";
    return (
      <div
        css={`
          display: flex;
          justify-content: center;
          align-items: center;

          box-sizing: border-box;

          width: 100%;
          min-height: ${logoHeight};

          overflow: hidden;

          a {
            display: flex;
            -webkit-box-align: center;
            align-items: center;
            -webkit-box-pack: center;
            justify-content: center;
          }
          span {
            display: block;
          }
          img {
            max-height: 100%;
            max-width: 100%;
          }

          font-family: ${(p: any) => p.theme.fontPop};

          padding: ${(p: any) => p.theme.logoPaddingHorizontal}
            ${(p: any) => p.theme.logoPaddingVertical};

          @media (max-width: ${(p: any) => p.theme.sm}px) {
            height: ${(p: any) => p.theme.logoSmallHeight};

            padding: ${(p: any) => p.theme.logoSmallPaddingHorizontal}
              ${(p: any) => p.theme.logoSmallPaddingVertical};

            // Remove a "display: flex" on small screen if only showing one brandingHtmlElement
            a {
              ${brandingHtmlElements.length > 0 ? "display: unset;" : ""}
            }
          }
        `}
      >
        {brandingHtmlElements.map((element, idx) => (
          <React.Fragment key={idx}>
            {parseCustomHtmlToReact(
              element.replace(/\{\{\s*version\s*\}\}/g, version),
              { disableExternalLinkIcon: true }
            )}
          </React.Fragment>
        ))}
      </div>
    );
  })
);
