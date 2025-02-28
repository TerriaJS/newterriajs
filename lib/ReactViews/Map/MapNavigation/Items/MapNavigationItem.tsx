import { i18n } from "i18next";
import { observer } from "mobx-react";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import styled from "styled-components";
import { applyTranslationIfExists } from "../../../../Language/languageHelpers";
import Terria from "../../../../Models/Terria";
import Box from "../../../../Styled/Box";
import Icon, { GLYPHS } from "../../../../Styled/Icon";
import { IMapNavigationItem } from "../../../../ViewModels/MapNavigation/MapNavigationModel";
import MapIconButton from "../../../MapIconButton/MapIconButton";

interface PropTypes {
  item: IMapNavigationItem;
  terria: Terria;
  closeTool?: boolean;
  expandInPlace?: boolean;
  i18n: i18n;
}

@observer
class MapNavigationItemBase extends Component<PropTypes> {
  render() {
    const { closeTool = true, item, expandInPlace, i18n } = this.props;
    if (item.render)
      return (
        <Control key={item.id} ref={item.controller.itemRef}>
          {item.render}
        </Control>
      );
    return (
      <Control ref={item.controller.itemRef}>
        {/* in small screens, do not expand in place to avoid overlapping buttons */}
        <MapIconButton
          expandInPlace={expandInPlace === undefined ? true : expandInPlace}
          noExpand={item.noExpand}
          iconElement={() => <Icon glyph={item.controller.glyph} />}
          title={applyTranslationIfExists(item.title || item.name, i18n)}
          onClick={() => {
            item.controller.handleClick();
          }}
          disabled={item.controller.disabled}
          primary={item.controller.active}
          closeIconElement={
            closeTool ? () => <Icon glyph={GLYPHS.closeTool} /> : undefined
          }
        >
          {applyTranslationIfExists(item.name, i18n)}
        </MapIconButton>
      </Control>
    );
  }
}

export const Control = styled(Box).attrs({
  centered: true,
  column: true
})`
  pointer-events: auto;
  @media (min-width: ${(props) => props.theme.sm}px) {
    margin: 0;
    padding-top: 10px;
    height: auto;
  }
  @media (max-width: ${(props) => props.theme.mobile}px) {
    padding-right: 10px;
    margin-bottom: 5px;
  }
  text-align: center;
`;

export const MapNavigationItem = withTranslation()(MapNavigationItemBase);
