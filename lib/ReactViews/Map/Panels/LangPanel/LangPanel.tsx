import { useTranslation } from "react-i18next";
import Terria from "../../../../Models/Terria";
import Box from "../../../../Styled/Box";
import { RawButton } from "../../../../Styled/Button";
import Icon from "../../../../Styled/Icon";
import Ul, { Li } from "../../../../Styled/List";
import MenuPanel from "../../../StandardUserInterface/customizable/MenuPanel";
import Styles from "../../MenuBar/menu-bar.scss";

const stripLangLocale = (lang: string = ""): string => lang.split("-")[0];

type Props = {
  terria: Terria;
  smallScreen: boolean;
};

const LangPanel = (props: Props) => {
  const { t, i18n } = useTranslation();

  if (!props.terria.configParameters.languageConfiguration?.languages) {
    return null;
  }

  return (
    <MenuPanel
      //@ts-expect-error - not yet ready to tackle tsfying MenuPanel
      theme={{
        btn: Styles.langBtn,
        icon: Icon.GLYPHS.globe
      }}
      btnText={
        props.smallScreen
          ? t("languagePanel.changeLanguage")
          : stripLangLocale(i18n.language)
      }
      mobileIcon={Icon.GLYPHS.globe}
      smallScreen={props.smallScreen}
    >
      <Box styledPadding={"20px 10px 10px 10px"}>
        <Ul
          spaced
          lined
          fullWidth
          column
          css={`
            padding-left: 0;
          `}
        >
          {Object.entries(
            props.terria.configParameters.languageConfiguration.languages
          ).map(([key, value]) => (
            <Li key={key}>
              <RawButton onClick={() => i18n.changeLanguage(key)}>
                {value}
              </RawButton>
            </Li>
          ))}
        </Ul>
      </Box>
    </MenuPanel>
  );
};
export default LangPanel;
