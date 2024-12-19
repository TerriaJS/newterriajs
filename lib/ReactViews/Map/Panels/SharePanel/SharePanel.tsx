import classNames from "classnames";
import { observer } from "mobx-react";
import { Component } from "react";
import {
  WithTranslation,
  withTranslation,
  type TFunction
} from "react-i18next";
import Terria from "../../../../Models/Terria";
import ViewState from "../../../../ReactViewModels/ViewState";
import Box from "../../../../Styled/Box";
import Spacing from "../../../../Styled/Spacing";
import Text from "../../../../Styled/Text";
import { canShorten } from "./BuildShareLink";
import Styles from "./share-panel.scss";
import { SharePanelContent } from "./SharePanelContent";
import { ShareUrl } from "./ShareUrl";
import MenuPanel from "../../../StandardUserInterface/customizable/MenuPanel";
import StorySharePanel from "./StorySharePanel";

interface PropTypes extends WithTranslation {
  terria: Terria;
  storyShare: boolean;
  catalogShare?: boolean;
  catalogShareWithoutText?: boolean;
  modalWidth: number;
  viewState: ViewState;
  onUserClick: () => void;
  btnDisabled: boolean;
  t: TFunction;
}

interface SharePanelState {
  isOpen: boolean;
}

@observer
class SharePanel extends Component<PropTypes, SharePanelState> {
  static displayName = "SharePanel";

  constructor(props: PropTypes) {
    super(props);
    this.changeOpenState = this.changeOpenState.bind(this);
    this.closePanel = this.closePanel.bind(this);

    this.state = {
      isOpen: false
    };
  }

  changeOpenState(open: boolean) {
    this.setState({
      isOpen: open
    });

    if (open) {
      if (this.props.catalogShare || this.props.storyShare) {
        this.props.viewState.shareModalIsVisible = true;
      }
    }
  }

  closePanel() {
    this.setState({
      isOpen: false
    });
  }

  renderContent() {
    const { terria, viewState, t } = this.props;

    if (this.props.catalogShare) {
      return (
        <Box fullWidth column paddedRatio={3}>
          <Text medium textDark>
            {t("clipboard.shareURL")}
          </Text>
          <Spacing bottom={1} />
          <ShareUrl
            terria={terria}
            viewState={viewState}
            includeStories
            shouldShorten={shouldShorten(terria)}
            theme="light"
            inputTheme="light"
          />
        </Box>
      );
    } else if (this.props.storyShare) {
      return (
        <Box fullWidth column paddedRatio={3}>
          <Text medium>{t("clipboard.shareURL")}</Text>
          <Spacing bottom={1} />
          <ShareUrl
            terria={terria}
            viewState={viewState}
            includeStories
            shouldShorten={shouldShorten(terria)}
            theme="dark"
            inputTheme="light"
            rounded
          />
        </Box>
      );
    } else {
      return (
        <SharePanelContent
          terria={terria}
          viewState={viewState}
          closePanel={this.closePanel}
        />
      );
    }
  }

  render() {
    const { t } = this.props;
    const { catalogShare, storyShare, catalogShareWithoutText, modalWidth } =
      this.props;
    const dropdownTheme = {
      btn: classNames({
        [Styles.btnCatalogShare]: catalogShare,
        [Styles.btnWithoutText]: catalogShareWithoutText
      }),
      outer: classNames(Styles.sharePanel, {
        [Styles.catalogShare]: catalogShare,
        [Styles.storyShare]: storyShare
      }),
      inner: classNames(Styles.dropdownInner, {
        [Styles.catalogShareInner]: catalogShare,
        [Styles.storyShareInner]: storyShare
      }),
      icon: "share"
    };

    const btnText = catalogShare
      ? t("share.btnCatalogShareText")
      : storyShare
      ? t("share.btnStoryShareText")
      : t("share.btnMapShareText");
    const btnTitle = catalogShare
      ? t("share.btnCatalogShareTitle")
      : storyShare
      ? t("share.btnStoryShareTitle")
      : t("share.btnMapShareTitle");

    return !storyShare ? (
      <MenuPanel
        //@ts-expect-error - not yet ready to tackle tsfying MenuPanel
        theme={dropdownTheme}
        btnText={catalogShareWithoutText ? null : btnText}
        viewState={this.props.viewState}
        btnTitle={btnTitle}
        isOpen={this.state.isOpen}
        onOpenChanged={this.changeOpenState}
        showDropdownAsModal={catalogShare}
        modalWidth={modalWidth}
        smallScreen={this.props.viewState.useSmallScreenInterface}
        onDismissed={() => {
          if (catalogShare) this.props.viewState.shareModalIsVisible = false;
        }}
        onUserClick={this.props.onUserClick}
        disableCloseOnFocusLoss={this.props.viewState.retainSharePanel}
      >
        {this.state.isOpen && this.renderContent()}
      </MenuPanel>
    ) : (
      <StorySharePanel
        btnText={catalogShareWithoutText ? null : btnText}
        viewState={this.props.viewState}
        btnTitle={btnTitle}
        isOpen={this.state.isOpen}
        //@ts-expect-error - not yet ready to tackle tsfying StorySharePanel
        onOpenChanged={this.changeOpenState}
        showDropdownAsModal={storyShare}
        modalWidth={modalWidth}
        smallScreen={this.props.viewState.useSmallScreenInterface}
        btnDisabled={this.props.btnDisabled}
        onDismissed={() => {
          if (storyShare) this.props.viewState.shareModalIsVisible = false;
        }}
        onUserClick={this.props.onUserClick}
      >
        {this.state.isOpen && this.renderContent()}
      </StorySharePanel>
    );
  }
}

export default withTranslation()(SharePanel);

export function shouldShorten(terria: Terria) {
  return (
    stringToBool(terria.getLocalProperty("shortenShareUrls")) ??
    !!canShorten(terria)
  );
}

function stringToBool(s: string | boolean | null | undefined) {
  if (s === true) return true;
  if (s === false) return false;
  if (s === "true") return true;
  if (s === "false") return false;
  return undefined;
}
