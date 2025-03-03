import PropTypes from "prop-types";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";
import Box from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import Icon from "../../Styled/Icon";
import Text from "../../Styled/Text";
import PrivateIndicator from "../PrivateIndicator/PrivateIndicator";

export enum ButtonState {
  Loading,
  Remove,
  Add,
  Trash,
  Stats,
  Preview
}

const STATE_TO_ICONS: Record<ButtonState, React.ReactElement> = {
  [ButtonState.Loading]: <Icon glyph={Icon.GLYPHS.loader} />,
  [ButtonState.Remove]: <Icon glyph={Icon.GLYPHS.minus} />,
  [ButtonState.Add]: <Icon glyph={Icon.GLYPHS.plus} />,
  [ButtonState.Trash]: <Icon glyph={Icon.GLYPHS.trashcan} />,
  [ButtonState.Stats]: <Icon glyph={Icon.GLYPHS.barChart} />,
  [ButtonState.Preview]: <Icon glyph={Icon.GLYPHS.right} />
};

interface Props {
  isPrivate?: boolean;
  title: string;
  text: string;
  selected?: boolean;
  trashable?: boolean;

  btnState: ButtonState;
  onBtnClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onTextClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onTrashClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  titleOverrides?: Partial<Record<ButtonState, string>>;
}

/** Dumb catalog item */
function CatalogItem(props: Props) {
  const { t } = useTranslation();
  const STATE_TO_TITLE = {
    [ButtonState.Loading]: t("catalogItem.loading"),
    [ButtonState.Remove]: t("catalogItem.remove"),
    [ButtonState.Add]: t("catalogItem.add"),
    [ButtonState.Trash]: t("catalogItem.trash"),
    [ButtonState.Preview]: t("catalogItem.preview")
  };
  const stateToTitle: Partial<Record<ButtonState, string>> = defaultValue(
    props.titleOverrides,
    STATE_TO_TITLE
  );
  return (
    <Root>
      <Text fullWidth primary={props.isPrivate} bold={props.selected} breakWord>
        <ItemTitleButton
          selected={props.selected}
          trashable={props.trashable}
          type="button"
          onClick={props.onTextClick}
          title={props.title}
        >
          {props.text}
        </ItemTitleButton>
      </Text>
      <Box>
        {props.isPrivate && <PrivateIndicator />}
        <ActionButton
          type="button"
          onClick={props.onBtnClick}
          title={stateToTitle[props.btnState] || ""}
        >
          {STATE_TO_ICONS[props.btnState]}
        </ActionButton>
        {props.trashable && (
          <ActionButton
            type="button"
            onClick={props.onTrashClick}
            title={stateToTitle[ButtonState.Trash]}
          >
            {STATE_TO_ICONS[ButtonState.Trash]}
          </ActionButton>
        )}
      </Box>
    </Root>
  );
}

const Root = styled.li`
  display: flex;
  width: 100%;
`;

const ItemTitleButton = styled(RawButton)<{
  selected?: boolean;
  trashable?: boolean;
}>`
  text-align: left;
  word-break: normal;
  overflow-wrap: anywhere;
  padding: 10px;
  width: 100%;
  font-size: 0.8125rem;

  &:focus,
  &:hover {
    color: ${(p) => p.theme.modalHighlight};
  }

  ${(p) => p.selected && `color: ${p.theme.modalHighlight};`}

  @media (max-width: ${(p) => p.theme.sm}px) {
    font-size: 0.9rem;
    padding-top: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${(p) => p.theme.greyLighter};
  }
`;

const ActionButton = styled(RawButton)`
  svg {
    height: 12px;
    width: 12px;
    margin: 5px;
    fill: ${(p) => p.theme.grey};
  }

  &:hover,
  &:focus {
    svg {
      fill: ${(p) => p.theme.modalHighlight};
    }
  }
`;

CatalogItem.propTypes = {
  onTextClick: PropTypes.func,
  isPrivate: PropTypes.bool,
  selected: PropTypes.bool,
  text: PropTypes.string,
  title: PropTypes.string,
  trashable: PropTypes.bool,
  onTrashClick: PropTypes.func,
  onBtnClick: PropTypes.func,
  btnState: PropTypes.oneOf([
    ButtonState.Add,
    ButtonState.Loading,
    ButtonState.Preview,
    ButtonState.Remove,
    ButtonState.Stats,
    ButtonState.Trash
  ]),
  titleOverrides: PropTypes.object
};

export default CatalogItem;
