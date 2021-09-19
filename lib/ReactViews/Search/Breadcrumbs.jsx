import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Box from "../../Styled/Box";
import { getParentGroups } from "../../Core/getPath";
import Text from "../../Styled/Text";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Spacing from "../../Styled/Spacing";
import { RawButton } from "../../Styled/Button";
import styled from "styled-components";
import getAncestors from "../../Models/getAncestors";
import getDereferencedIfExists from "../../Core/getDereferencedIfExists";
import { runInAction } from "mobx";
import CommonStrata from "../../Models/Definition/CommonStrata";

const RawButtonAndUnderline = styled(RawButton)`
  ${props => `
  &:hover, &:focus {
    text-decoration: underline ${props.theme.textDark};
  }`}
`;

@observer
class Breadcrumbs extends Component {
  static propTypes = {
    terria: PropTypes.object,
    viewState: PropTypes.object,
    previewed: PropTypes.object,
    theme: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  async openInCatalog(items) {
    items.forEach(item => {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "isOpen", true);
      });
    });
    await this.props.viewState.viewCatalogMember(items[0]);
    this.props.viewState.changeSearchState("");
  }

  render() {
    const parentGroups = this.props.previewed
      ? getParentGroups(this.props.previewed)
      : undefined;
    const ancestors = getAncestors(this.props.previewed).map(ancestor =>
      getDereferencedIfExists(ancestor)
    );
    return (
      // Note: should it reset the text if a person deletes current search and starts a new search?
      <Box
        left
        styledMinHeight={"32px"}
        fullWidth
        backgroundColor={this.props.theme.greyLighter}
        paddedHorizontally={2.4}
        paddedVertically={1}
        wordBreak="break-all"
      >
        <StyledIcon
          styledWidth={"16px"}
          fillColor={this.props.theme.textDark}
          glyph={Icon.GLYPHS.globe}
        />
        <Spacing right={1.2} />
        <Box flexWrap>
          {parentGroups && (
            <For each="parent" index="i" of={parentGroups}>
              <Choose>
                {/* No link when it's the current member */}
                <When condition={i === parentGroups.length - 1}>
                  <Text small textDark>
                    {parent}
                  </Text>
                </When>
                {/* The first and last two groups use the full name */}
                <When condition={i <= 1 || i >= parentGroups.length - 2}>
                  <RawButtonAndUnderline
                    type="button"
                    onClick={() =>
                      this.openInCatalog(ancestors.slice(i, i + 1))
                    }
                  >
                    <Text small textDark>
                      {parent}
                    </Text>
                  </RawButtonAndUnderline>
                </When>
                {/* The remainder are just '..' to prevent/minimise overflowing */}
                <When condition={i > 1 && i < parentGroups.length - 2}>
                  <Text small textDark>
                    {"..."}
                  </Text>
                </When>
              </Choose>

              <If condition={i !== parentGroups.length - 1}>
                <Box paddedHorizontally={1}>
                  <Text small textDark>
                    {">"}
                  </Text>
                </Box>
              </If>
            </For>
          )}
        </Box>
      </Box>
    );
  }
}

export default withTranslation()(withTheme(Breadcrumbs));
