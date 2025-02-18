import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { FC } from "react";
import { useTranslation, withTranslation } from "react-i18next";
import styled from "styled-components";
import defined from "terriajs-cesium/Source/Core/defined";
import SplitDirection from "terriajs-cesium/Source/Scene/SplitDirection";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import hasTraits from "../../../Models/Definition/hasTraits";
import Model from "../../../Models/Definition/Model";
import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import Spacing from "../../../Styled/Spacing";
import SplitterTraits from "../../../Traits/TraitsClasses/SplitterTraits";

interface ILeftRightButton {
  isActive: boolean;
}

const LeftRightButton = styled(RawButton).attrs({
  fullWidth: true
})<ILeftRightButton>`
  text-align: center;
  padding: 5px;
  color: ${(p) => p.theme.textLight};
  background-color: ${(p) => p.theme.dark};
  ${(p) =>
    p.isActive &&
    `
    background-color: ${p.theme.colorSecondary};
  `}
  &:hover,
  &:focus {
    background-color: ${(p) => p.theme.colorSecondary};
  }
`;

interface ILeftRightSection {
  item: Model<SplitterTraits>;
}

const LeftRightSection: FC<React.PropsWithChildren<ILeftRightSection>> =
  observer(({ item }: ILeftRightSection) => {
    const goLeft = () => {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "splitDirection", SplitDirection.LEFT);
      });
    };

    const goBoth = () => {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "splitDirection", SplitDirection.NONE);
      });
    };

    const goRight = () => {
      runInAction(() => {
        item.setTrait(
          CommonStrata.user,
          "splitDirection",
          SplitDirection.RIGHT
        );
      });
    };

    const { t } = useTranslation();
    const splitDirection = item.splitDirection;

    if (
      !hasTraits(item, SplitterTraits, "splitDirection") ||
      item.disableSplitter ||
      !defined(splitDirection) ||
      !item.terria.showSplitter
    ) {
      return null;
    }

    return (
      <>
        <Spacing bottom={3} />
        <Box>
          <LeftRightButton
            type="button"
            onClick={goLeft}
            title={t("splitterTool.workbench.goleftTitle")}
            isActive={splitDirection === SplitDirection.LEFT}
          >
            {t("splitterTool.workbench.goleft")}
          </LeftRightButton>
          <LeftRightButton
            type="button"
            onClick={goBoth}
            title={t("splitterTool.workbench.bothTitle")}
            isActive={splitDirection === SplitDirection.NONE}
          >
            {t("splitterTool.workbench.both")}
          </LeftRightButton>
          <LeftRightButton
            type="button"
            onClick={goRight}
            title={t("splitterTool.workbench.gorightTitle")}
            isActive={splitDirection === SplitDirection.RIGHT}
          >
            {t("splitterTool.workbench.goright")}
          </LeftRightButton>
        </Box>
      </>
    );
  });

export default withTranslation()(LeftRightSection);
