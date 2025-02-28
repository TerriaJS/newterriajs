import { observer } from "mobx-react";
import PropTypes from "prop-types";
import { Component } from "react";
import { withTranslation } from "react-i18next";
import { withTheme } from "styled-components";
import Box from "../../../../Styled/Box";
import FadeIn from "../../../Transitions/FadeIn/FadeIn";
import Loader from "../../../Loader";
import { useKeyPress } from "../../../Hooks/useKeyPress.js";
import { RawButton } from "../../../../Styled/Button";
import Icon, { StyledIcon } from "../../../../Styled/Icon";

const VideoWrapperBox = (props) => {
  const { viewState } = props;
  const handleClose = () => viewState.setVideoGuideVisible("");

  useKeyPress("Escape", () => {
    handleClose();
  });

  return (
    <Box
      centered
      onClick={(e) => {
        e.stopPropagation();
        handleClose();
      }}
      css={`
        position: fixed;
        z-index: 99999;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.75);
      `}
    >
      <Box paddedRatio={4} position="absolute" topRight>
        <RawButton onClick={handleClose.bind(null)}>
          <StyledIcon
            styledWidth={"22px"}
            light
            glyph={Icon.GLYPHS.closeLight}
          />
        </RawButton>
      </Box>
      {props.children}
    </Box>
  );
};

VideoWrapperBox.propTypes = {
  viewState: PropTypes.object.isRequired,
  children: PropTypes.node
};

@observer
class VideoGuide extends Component {
  static displayName = "VideoGuide";

  static propTypes = {
    viewState: PropTypes.object.isRequired,
    videoName: PropTypes.string.isRequired,
    videoLink: PropTypes.string,
    background: PropTypes.string,
    // A number between 0 and 1.0
    backgroundOpacity: PropTypes.number,
    theme: PropTypes.object,
    t: PropTypes.func
  };

  render() {
    const backgroundOpacity = this.props.backgroundOpacity;
    const backgroundBlackOverlay =
      backgroundOpacity === undefined ? undefined : 1.0 - backgroundOpacity;
    return (
      <FadeIn
        isVisible={
          this.props.viewState.videoGuideVisible === this.props.videoName
        }
      >
        <VideoWrapperBox viewState={this.props.viewState}>
          <Box
            centered
            col11
            styledHeight={"87%"}
            backgroundImage={this.props.background}
            backgroundBlackOverlay={backgroundBlackOverlay}
            css={`
              svg {
                fill: #fff;
                width: 60px;
                height: 60px;
                top: -30px;
                left: -30px;
              }
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <Loader message={` `} />
            <iframe
              src={this.props.videoLink}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              css={`
                border: none;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
              `}
            />
          </Box>
        </VideoWrapperBox>
      </FadeIn>
    );
  }
}

export default withTranslation()(withTheme(VideoGuide));
