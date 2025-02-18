import { FC, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import Box from "../../../../Styled/Box";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import { useCallbackRef } from "../../../useCallbackRef";
import { AdvancedOptions } from "./AdvancedOptions";
import { canShorten } from "./BuildShareLink";
import { PrintSection } from "./Print/PrintSection";
import { shouldShorten as shouldShortenDefault } from "./SharePanel";
import { IShareUrlRef, ShareUrl, ShareUrlBookmark } from "./ShareUrl";
import { StyledHr } from "./StyledHr";

interface ISharePanelContentProps {
  terria: Terria;
  viewState: ViewState;
  closePanel: () => void;
}

export const SharePanelContent: FC<
  React.PropsWithChildren<ISharePanelContentProps>
> = ({ terria, viewState, closePanel }) => {
  const { t } = useTranslation();
  const canShortenUrl = useMemo(() => !!canShorten(terria), [terria]);

  const [includeStoryInShare, setIncludeStoryInShare] = useState(true);
  const [shouldShorten, setShouldShorten] = useState(
    shouldShortenDefault(terria)
  );

  const [_, update] = useState<object>();
  const shareUrlRef = useCallbackRef<IShareUrlRef>(null, () => update({}));

  const includeStoryInShareOnChange = useCallback(() => {
    setIncludeStoryInShare((prevState) => !prevState);
  }, []);

  const shouldShortenOnChange = useCallback(() => {
    setShouldShorten((prevState) => {
      terria.setLocalProperty("shortenShareUrls", !prevState);
      return !prevState;
    });
  }, [terria]);

  return (
    <Box paddedRatio={2} column>
      <Text medium>{t("clipboard.shareURL")}</Text>
      <Spacing bottom={1} />
      <ShareUrl
        theme="dark"
        inputTheme="dark"
        terria={terria}
        viewState={viewState}
        includeStories={includeStoryInShare}
        shouldShorten={shouldShorten}
        ref={shareUrlRef}
        callback={closePanel}
      >
        <ShareUrlBookmark viewState={viewState} />
      </ShareUrl>
      <Spacing bottom={2} />
      <PrintSection viewState={viewState} />
      <StyledHr />
      <AdvancedOptions
        canShortenUrl={canShortenUrl}
        shouldShorten={shouldShorten}
        shouldShortenOnChange={shouldShortenOnChange}
        includeStoryInShare={includeStoryInShare}
        includeStoryInShareOnChange={includeStoryInShareOnChange}
        shareUrl={shareUrlRef}
      />
    </Box>
  );
};
