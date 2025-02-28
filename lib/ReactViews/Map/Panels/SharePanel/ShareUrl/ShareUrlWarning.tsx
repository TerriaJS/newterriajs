import { FC } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { observer } from "mobx-react";

import { getName } from "../../../../../ModelMixins/CatalogMemberMixin";
import ViewState from "../../../../../ReactViewModels/ViewState";
import Terria from "../../../../../Models/Terria";

import Box from "../../../../../Styled/Box";
import Ul, { Li } from "../../../../../Styled/List";
import Text from "../../../../../Styled/Text";

import { isShareable } from "../BuildShareLink";

interface IShareUrlWarningProps {
  terria: Terria;
  viewState: ViewState;
  callback: () => void;
}

const WarningBox = styled(Box).attrs({
  paddedRatio: 2,
  rounded: true,
  column: true
})`
  background: #feb938;
  color: #552800;
`;

const WarningLink = styled.a`
  color: #552800;
  text-decoration: underline;
  cursor: pointer;
`;

export const ShareUrlWarning: FC<IShareUrlWarningProps> = observer(
  ({ terria, viewState, callback }) => {
    const { t } = useTranslation();

    const unshareableItems =
      terria.catalog.userAddedDataGroup.memberModels.filter(
        (model) => !isShareable(terria)(model.uniqueId || "")
      );

    if (unshareableItems.length === 0) {
      return null;
    }

    const addWebData = () => {
      viewState.openUserData();
      callback();
    };

    return (
      <WarningBox>
        <Trans t={t} i18nKey="share.localDataNote">
          <Text bold>
            <strong>Note:</strong>
          </Text>
          <Text>
            The following data sources will NOT be shared because they include
            data from this local system or from an authenticated online service.
            To share these data sources, publish their data on a web server and{" "}
            <WarningLink onClick={addWebData}>add them using a url</WarningLink>
            .
          </Text>
        </Trans>
        <Ul
          css={`
            padding: 0;
          `}
        >
          {unshareableItems.map((item, i) => {
            return (
              <Li key={i}>
                <strong>{getName(item)}</strong>
              </Li>
            );
          })}
        </Ul>
      </WarningBox>
    );
  }
);
