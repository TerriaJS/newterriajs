import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component, Fragment } from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Box from "../../Styled/Box";
import { getParentGroups } from "../../Core/getPath";
import Text, { TextSpan } from "../../Styled/Text";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Spacing from "../../Styled/Spacing";
import { RawButton } from "../../Styled/Button";
import styled from "styled-components";
import getAncestors from "../../Models/getAncestors";
import getDereferencedIfExists from "../../Core/getDereferencedIfExists";
import { runInAction } from "mobx";
import CommonStrata from "../../Models/Definition/CommonStrata";

const RawButtonAndUnderline = styled(RawButton)`
  ${(props) => `
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
    items.forEach((item) => {
      runInAction(() => {
        item.setTrait(CommonStrata.user, "isOpen", true);
      });
    });
    (await this.props.viewState.viewCatalogMember(items[0])).raiseError(
      this.props.viewState.terria
    );
    this.props.viewState.changeSearchState("");
  }

  renderCrumb(parent, i, parentGroups) {
    const ancestors = getAncestors(this.props.previewed).map((ancestor) =>
      getDereferencedIfExists(ancestor)
    );

    /* No link when it's the current member */
    if (i === parentGroups.length - 1) {
      return (
        <Text small textDark>
          {parent}
        </Text>
      );
      /* The first and last two groups use the full name */
    } else if (i <= 1 || i >= parentGroups.length - 2) {
      return (
        <RawButtonAndUnderline
          type="button"
          onClick={() => this.openInCatalog(ancestors.slice(i, i + 1))}
        >
          <TextSpan small textDark>
            {parent}
          </TextSpan>
        </RawButtonAndUnderline>
      );
      /* The remainder are just '..' to prevent/minimise overflowing */
    } else if (i > 1 && i < parentGroups.length - 2) {
      return (
        <Text small textDark>
          {"..."}
        </Text>
      );
    }

    return null;
  }

  render() {
    const parentGroups = this.props.previewed
      ? getParentGroups(this.props.previewed)
      : undefined;

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
          {parentGroups &&
            parentGroups.map((parent, i) => (
              <Fragment key={i}>
                {this.renderCrumb(parent, i, parentGroups)}
                {i !== parentGroups.length - 1 && (
                  <Box paddedHorizontally={1}>
                    <Text small textDark>
                      {">"}
                    </Text>
                  </Box>
                )}
              </Fragment>
            ))}
        </Box>
      </Box>
    );
  }
}

export default withTranslation()(withTheme(Breadcrumbs));
