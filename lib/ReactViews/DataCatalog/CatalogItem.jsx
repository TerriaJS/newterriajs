import PropTypes from "prop-types";
import classNames from "classnames";
import Icon from "../../Styled/Icon";
import PrivateIndicator from "../PrivateIndicator/PrivateIndicator";
import { useTranslation } from "react-i18next";
import defaultValue from "terriajs-cesium/Source/Core/defaultValue";

import Styles from "./data-catalog-item.scss";

import Box from "../../Styled/Box";
import Text from "../../Styled/Text";

const STATE_TO_ICONS = {
  loading: <Icon glyph={Icon.GLYPHS.loader} />,
  remove: <Icon glyph={Icon.GLYPHS.remove} />,
  add: <Icon glyph={Icon.GLYPHS.add} />,
  trash: <Icon glyph={Icon.GLYPHS.trashcan} />,
  stats: <Icon glyph={Icon.GLYPHS.barChart} />,
  preview: <Icon glyph={Icon.GLYPHS.right} />
};

/** Dumb catalog item */
function CatalogItem(props) {
  const { t } = useTranslation();
  const STATE_TO_TITLE = {
    loading: t("catalogItem.loading"),
    remove: t("catalogItem.remove"),
    add: t("catalogItem.add"),
    trash: t("catalogItem.trash")
  };
  const stateToTitle = defaultValue(props.titleOverrides, STATE_TO_TITLE);
  return (
    <li className={classNames(Styles.root)}>
      <Text fullWidth primary={props.isPrivate}>
        <button
          type="button"
          onClick={props.onTextClick}
          title={props.title}
          className={classNames(Styles.btnCatalogItem, {
            [Styles.btnCatalogItemIsPreviewed]: props.selected,
            [Styles.btnCatalogItemIsTrashable]: props.selected
          })}
        >
          {props.text}
        </button>
      </Text>
      <Box>
        {props.isPrivate && <PrivateIndicator />}
        <button
          type="button"
          onClick={props.onBtnClick}
          title={stateToTitle[props.btnState] || ""}
          className={Styles.btnAction}
        >
          {STATE_TO_ICONS[props.btnState]}
        </button>
        {props.trashable && (
          <button
            type="button"
            onClick={props.onTrashClick}
            title={stateToTitle["trash"]}
            className={classNames(Styles.btnAction, Styles.btnTrash)}
          >
            {STATE_TO_ICONS["trash"]}
          </button>
        )}
      </Box>
    </li>
  );
}

CatalogItem.propTypes = {
  onTextClick: PropTypes.func,
  isPrivate: PropTypes.bool,
  selected: PropTypes.bool,
  text: PropTypes.string,
  title: PropTypes.string,
  trashable: PropTypes.bool,
  onTrashClick: PropTypes.func,
  onBtnClick: PropTypes.func,
  btnState: PropTypes.oneOf(Object.keys(STATE_TO_ICONS)),
  titleOverrides: PropTypes.object
};

export default CatalogItem;
