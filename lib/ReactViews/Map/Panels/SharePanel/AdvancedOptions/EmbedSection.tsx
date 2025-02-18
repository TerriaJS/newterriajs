import { FC } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import Box from "../../../../../Styled/Box";
import { TextSpan } from "../../../../../Styled/Text";
import Input from "../../../../../Styled/Input";

import { IShareUrlRef } from "../ShareUrl";

interface IEmbedSectionProps {
  shareUrl: IShareUrlRef | null;
}

export const EmbedSection: FC<React.PropsWithChildren<IEmbedSectionProps>> = ({
  shareUrl
}) => {
  const { t } = useTranslation();
  const iframeCode =
    shareUrl?.url && shareUrl.url.length > 0
      ? `<iframe style="width: 720px; height: 600px; border: none;" src="${shareUrl.url}" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>`
      : "";

  return (
    <Box column>
      <TextSpan medium>{t("share.embedTitle")}</TextSpan>
      <Explanation>{t("share.embedDescription")}</Explanation>
      <Input
        large
        dark
        type="text"
        readOnly
        placeholder={t("share.shortLinkShortening")}
        value={!shareUrl?.shorteningInProgress ? iframeCode : ""}
        onClick={(e) => e.currentTarget.select()}
      />
    </Box>
  );
};

const Explanation = styled(TextSpan)`
  opacity: 0.8;
`;
