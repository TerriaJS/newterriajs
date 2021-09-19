import { observer } from "mobx-react";
import { Component } from "react";
import styled from "styled-components";
import { useTranslationIfExists } from "../../../../Language/languageHelpers";
import Terria from "../../../../Models/Terria";
import Box from "../../../../Styled/Box";
import Icon, { GLYPHS } from "../../../../Styled/Icon";
import { IMapNavigationItem } from "../../../../ViewModels/MapNavigation/MapNavigationModel";
import MapIconButton from "../../../MapIconButton/MapIconButton";

interface PropTypes {
  item: IMapNavigationItem;
  terria: Terria;
  closeTool?: boolean;
}

@observer
export class MapNavigationItem extends Component<PropTypes> {
  constructor(props: PropTypes) {
    super(props);
  }

  render() {
    const { closeTool = true, item } = this.props;
    if (item.render)
      return (
        <Control key={item.id} ref={item.controller.itemRef}>
          {item.render}
        </Control>
      );
    return (
      <Control ref={item.controller.itemRef}>
        <MapIconButton
          expandInPlace
          noExpand={item.noExpand}
          iconElement={() => <Icon glyph={item.controller.glyph} />}
          title={useTranslationIfExists(item.title || item.name)}
          onClick={() => {
            item.controller.handleClick();
          }}
          disabled={item.controller.disabled}
          primary={item.controller.active}
          closeIconElement={
            closeTool ? () => <Icon glyph={GLYPHS.closeTool} /> : undefined
          }
        >
          {useTranslationIfExists(item.name)}
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
  @media (min-width: ${props => props.theme.sm}px) {
    margin: 0;
    padding-top: 10px;
    height: auto;
  }
  @media (max-width: ${props => props.theme.mobile}px) {
    padding-right: 10px;
    margin-bottom: 5px;
  }
  text-align: center;
`;
