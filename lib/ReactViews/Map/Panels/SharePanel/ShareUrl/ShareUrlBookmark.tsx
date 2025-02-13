import { FC } from "react";
import { useTranslation } from "react-i18next";

import ViewState from "../../../../../ReactViewModels/ViewState";

import Text from "../../../../../Styled/Text";

interface IShareUrlBookmarkProps {
  viewState: ViewState;
}

const bookMarkHelpItemName = "bookmarkHelp";

export const ShareUrlBookmark: FC<IShareUrlBookmarkProps> = ({ viewState }) => {
  const { t } = useTranslation();

  return viewState.terria.configParameters.helpContent?.some(
    (e) => e.itemName === bookMarkHelpItemName
  ) ? (
    <Text
      medium
      textLight
      isLink
      onClick={(evt) =>
        viewState.openHelpPanelItemFromSharePanel(evt, bookMarkHelpItemName)
      }
    >
      {t("share.getShareSaveHelpMessage")}
    </Text>
  ) : null;
};
