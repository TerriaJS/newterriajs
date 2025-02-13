import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { RawButton } from "../../../Styled/Button";
import Icon, { StyledIcon } from "../../../Styled/Icon";

interface BtnProp {
  onClick: () => void;
}

export const CollapseBtn = ({
  isCollapsed,
  onClick
}: { isCollapsed: boolean } & BtnProp) => {
  const { t } = useTranslation();
  return (
    <RawButton
      title={isCollapsed ? t("story.expand") : t("story.collapse")}
      onClick={onClick}
    >
      {isCollapsed ? (
        <StoryIcon styledWidth={"20px"} glyph={Icon.GLYPHS.info} />
      ) : (
        <StoryIcon styledWidth={"12px"} glyph={Icon.GLYPHS.arrowDown} />
      )}
    </RawButton>
  );
};

export const ExitBtn = ({ onClick }: BtnProp) => {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <RawButton onClick={onClick} title={t("story.exitBtn")}>
      <StoryIcon
        styledWidth={"12px"}
        glyph={Icon.GLYPHS.close}
        css={`
          border-radius: 50%;
          border: 2px solid ${theme.textDark};
          padding: 2px;
          &:hover {
            border-color: ${theme.colorPrimary};
          }
        `}
      />
    </RawButton>
  );
};

export const StoryIcon = styled(StyledIcon).attrs((props) => ({
  fillColor: props.theme.textDark,
  opacity: 0.5
}))`
  &:hover {
    fill: ${(p) => p.theme.colorPrimary};
  }
`;
