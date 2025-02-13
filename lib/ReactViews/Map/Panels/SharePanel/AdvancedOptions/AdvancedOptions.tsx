import { FC, useState, MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import Box from "../../../../../Styled/Box";
import { RawButton } from "../../../../../Styled/Button";
import { GLYPHS, StyledIcon } from "../../../../../Styled/Icon";
import Spacing from "../../../../../Styled/Spacing";
import { TextSpan } from "../../../../../Styled/Text";
import { StyledHr } from "../StyledHr";
import Checkbox from "../../../../../Styled/Checkbox";

import { EmbedSection } from "./EmbedSection";
import { IShareUrlRef } from "../ShareUrl";

interface IAdvancedOptionsProps {
  canShortenUrl: boolean;
  shouldShorten: boolean;
  includeStoryInShare: boolean;
  includeStoryInShareOnChange: () => void;
  shouldShortenOnChange: () => void;
  shareUrl: MutableRefObject<IShareUrlRef | null>;
}

export const AdvancedOptions: FC<IAdvancedOptionsProps> = ({
  canShortenUrl,
  shouldShorten,
  includeStoryInShare,
  includeStoryInShareOnChange,
  shouldShortenOnChange,
  shareUrl
}) => {
  const { t } = useTranslation();

  const [advancedOptions, setAdvancedOptions] = useState(false);

  const toogleAdvancedOptions = () => {
    setAdvancedOptions((prevState) => !prevState);
  };

  return (
    <Box column>
      <RawButton
        onClick={toogleAdvancedOptions}
        css={`
          display: flex;
          align-items: center;
        `}
      >
        <TextSpan
          fullWidth
          medium
          css={`
            display: flex;
          `}
        >
          {t("share.btnAdvanced")}
        </TextSpan>
        {advancedOptions ? (
          <AdvanceOptionsIcon glyph={GLYPHS.opened} />
        ) : (
          <AdvanceOptionsIcon glyph={GLYPHS.closed} />
        )}
      </RawButton>

      {advancedOptions && (
        <>
          <StyledHr />
          <Box column>
            {/* IncludeStoryCheckbox */}
            <Checkbox
              textProps={{ medium: true }}
              id="includeStory"
              title="Include Story in Share"
              isChecked={includeStoryInShare}
              onChange={includeStoryInShareOnChange}
            >
              <TextSpan>{t("includeStory.message")}</TextSpan>
            </Checkbox>
            <Spacing bottom={1} />
            {/* ShortenWithServiceCheckbox */}
            <Checkbox
              textProps={{ medium: true }}
              id="shortenUrl"
              isChecked={shouldShorten}
              onChange={shouldShortenOnChange}
              isDisabled={!canShortenUrl}
            >
              <TextSpan>{t("share.shortenUsingService")}</TextSpan>
            </Checkbox>
            <Spacing bottom={2} />
            <EmbedSection shareUrl={shareUrl?.current} />
          </Box>
        </>
      )}
    </Box>
  );
};

const AdvanceOptionsIcon = styled(StyledIcon).attrs({
  styledWidth: "10px",
  light: true
})``;
