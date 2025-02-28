import { useTranslation } from "react-i18next";
import Icon from "../../Styled/Icon";
import IconWrapper from "../../Styled/IconWrapper";

interface PropsType {
  inWorkbench?: boolean;
}

export default function PrivateIndicator(props: PropsType) {
  const { t } = useTranslation();
  return (
    <IconWrapper
      marginRight={!props.inWorkbench}
      title={t("catalogItem.privateIndicatorTitle")}
      css={`
        margin-top: -1px;
        svg {
          width: 15px;
          height: 15px;
          fill: ${(p: any) =>
            p.inWorkbench ? p.theme.textLight : p.theme.charcoalGrey};
        }
      `}
    >
      <Icon glyph={Icon.GLYPHS.lock} />
    </IconWrapper>
  );
}
