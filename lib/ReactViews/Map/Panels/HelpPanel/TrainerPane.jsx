import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import styled from "styled-components";

import StyledHtml from "./StyledHtml";

import Box, { BoxSpan } from "../../../../Styled/Box";
import Button from "../../../../Styled/Button";
import Spacing from "../../../../Styled/Spacing";
// eslint-disable-next-line no-redeclare
import Text from "../../../../Styled/Text";

import { applyTranslationIfExists } from "../../../../Language/languageHelpers";

const UlTrainerItems = styled(Box).attrs({
  as: "ul"
})`
  ${(p) => p.theme.removeListStyles()}
`;

const TrainerButton = styled(Button)``;

@observer
class TrainerPane extends React.Component {
  static displayName = "TrainerPane";

  static propTypes = {
    viewState: PropTypes.object.isRequired,
    content: PropTypes.object.isRequired,
    t: PropTypes.func,
    i18n: PropTypes.object.isRequired
  };

  render() {
    const { content, i18n, viewState } = this.props;
    const { trainerItems, markdownText } = content;
    return (
      <Text textDark noFontSize>
        <Box column>
          {markdownText && (
            <StyledHtml viewState={viewState} markdown={markdownText} />
          )}
          {trainerItems?.map && (
            <UlTrainerItems column fullWidth justifySpaceBetween>
              {trainerItems.map((item, index) => (
                <li key={index}>
                  <TrainerButton
                    secondary
                    fullWidth
                    onClick={() => {
                      viewState.hideHelpPanel();
                      viewState.setSelectedTrainerItem(content.itemName);
                      viewState.setCurrentTrainerItemIndex(index);
                      viewState.setTrainerBarVisible(true);
                    }}
                  >
                    <BoxSpan centered>
                      <BoxSpan centered>
                        {applyTranslationIfExists(item.title, i18n)}
                      </BoxSpan>
                    </BoxSpan>
                  </TrainerButton>
                  <Spacing bottom={2} />
                </li>
              ))}
            </UlTrainerItems>
          )}
        </Box>
      </Text>
    );
  }
}

export default withTranslation()(withTheme(TrainerPane));
