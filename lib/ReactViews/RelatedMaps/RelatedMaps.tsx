import { observer } from "mobx-react";
import { Component } from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import { DefaultTheme, withTheme } from "styled-components";
import { RelatedMap } from "../../Models/RelatedMaps";
import Box from "../../Styled/Box";
import { ExternalLinkIcon } from "../Custom/ExternalLink";
import parseCustomMarkdownToReact from "../Custom/parseCustomMarkdownToReact";
import { withViewState, WithViewState } from "../Context";
import Styles from "./related-maps.scss";
import MenuPanel from "../StandardUserInterface/customizable/MenuPanel";

type PropTypes = WithViewState &
  WithTranslation & {
    theme: DefaultTheme;
    relatedMaps: RelatedMap[];
  };

@observer
class RelatedMaps extends Component<PropTypes> {
  render() {
    const t = this.props.t;
    const dropdownTheme = {
      inner: Styles.dropdownInner,
      icon: "gallery"
    };

    const smallScreen = this.props.viewState.useSmallScreenInterface;

    return (
      <MenuPanel
        //@ts-expect-error - not yet ready to tackle tsfying MenuPanel
        theme={dropdownTheme}
        btnText={t("relatedMaps.buttonText")}
        smallScreen={smallScreen}
        viewState={this.props.viewState}
        btnTitle={t("relatedMaps.buttonTitle")}
        showDropdownInCenter
      >
        <h2>{t("relatedMaps.panelHeading")}</h2>
        <p>{t("relatedMaps.panelText")}</p>
        {this.props.relatedMaps.map((map, i) => (
          <Box flex key={i}>
            <Box>
              <a target="_blank" href={map.url} rel="noreferrer">
                <img
                  style={{
                    marginRight: "10px",
                    marginBottom: "10px",
                    width: "200px",
                    height: "150px"
                  }}
                  src={map.imageUrl}
                  alt={map.title}
                />
              </a>
            </Box>

            <Box displayInlineBlock>
              <a
                target="_blank"
                style={{ color: this.props.theme.colorPrimary }}
                href={map.url}
                rel="noreferrer"
              >
                {map.title}
                <ExternalLinkIcon />
              </a>

              {parseCustomMarkdownToReact(map.description)}
            </Box>
          </Box>
        ))}
      </MenuPanel>
    );
  }
}

export default withTranslation()(withTheme(withViewState(RelatedMaps)));
